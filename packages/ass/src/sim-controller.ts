import { TestBedAdapter, LogLevel } from 'node-test-bed-adapter';
import { envServices, updateAgent } from './env-services';
import { IAgent, TransportType, ObjectType, IReactions, ISimConfig } from './models';
import { addGroup, uuid4, simTime, log, sleep, generateAgents, agentToFeature } from './utils';
import { redisServices, messageServices, reaction, chatServices } from './services';
import jsonSimConfig from './amok.json';
import reactionConfig from './plan_reactions.json';

// const SimEntityItemTopic = 'simulation_entity_item';
const SimEntityFeatureCollectionTopic = 'simulation_entity_featurecollection';

export const simConfig = (jsonSimConfig as unknown) as ISimConfig;
export const { customTypeAgendas } = simConfig;
export const { customAgendas } = simConfig;
export const { generateSettings } = simConfig;

/**
 * @param callback
 * Connect to Kafka and create a connector
 */
const createAdapter = (callback: (tb: TestBedAdapter) => void) => {
  const tb = new TestBedAdapter({
    kafkaHost: process.env.KAFKA_HOST || 'localhost:3501',
    schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
    clientId: 'agent-smith',
    produce: [SimEntityFeatureCollectionTopic],
    logging: {
      logToConsole: LogLevel.Info,
      logToKafka: LogLevel.Warn,
    },
  });
  tb.on('error', (e) => console.error(e));
  tb.on('ready', () => {
    log(`Current simulation time: ${tb.simulationTime}`);
    log('Producer is connected');
    callback(tb);
  });
  tb.connect();
};

export const simController = async (
  options: {
    /** Simulation speed. 0 is paused, 1 is real-time. */
    simSpeed?: number;
    startTime?: Date;
  } = {}
) => {
  createAdapter(async (tb) => {
    const { simSpeed = 10, startTime = simTime(0, simConfig.settings.startTimeHours ? simConfig.settings.startTimeHours : 0, simConfig.settings.startTimeMinutes ? simConfig.settings.startTimeMinutes : 0) } = options;
    const services = envServices({ latitudeAvg: 51.4 });
    services.setTime(startTime);
    // const agentstoshow = [] as IAgent[];

    const reactionImport: IReactions = reactionConfig;

    if (reactionImport) {
      // eslint-disable-next-line guard-for-in
      for (const key in reactionImport) {
        if (reaction[key]) {
          reaction[key] = reactionImport[key];
        }
      }
    }

    services.locations = simConfig.locations;
    services.equipments = simConfig.equipment;


    const blueAgents: IAgent[] = simConfig.customAgents.blue;
    const redAgents: IAgent[] = simConfig.customAgents.red;
    const whiteAgents: IAgent[] = simConfig.customAgents.white;
    const tbpAgents: IAgent[] = simConfig.customAgents.tbp;

    const agents = [...blueAgents, ...redAgents, ...whiteAgents, ...tbpAgents] as IAgent[];
    const currentSpeed = simSpeed;
    let currentTime = startTime;

    const updateTime = () => {
      currentTime = new Date(currentTime.valueOf() + 1000 * currentSpeed);
      services.setTime(currentTime);
    };

    const notifyOthers = () => {
      const payload = {
        topic: SimEntityFeatureCollectionTopic,
        messages: {
          id: uuid4(),
          name: 'agent-smith',
          owner: 'agent-smith',
          description: 'Agents generated by Agent-smith simulator',
          type: 'FeatureCollection',
          features: agents.map(agentToFeature),
        },
      };
      tb.send(payload, (error) => error && log(error));
    };

    if (simConfig.generateSettings) {
      for (const s of simConfig.generateSettings) {
        const { agents: generatedAgents, locations } = generateAgents(
          s.centerCoord[0],
          s.centerCoord[1],
          s.agentCount,
          s.radius,
          s.type,
          s.force,
          undefined,
          s.memberCount
        );

        services.locations = { ...services.locations, ...locations };
        agents.push(...generatedAgents);

        if (s.object) {
          for (const a of generatedAgents) {
            const { agents: generatedObject } = generateAgents(
              s.centerCoord[0],
              s.centerCoord[1],
              1,
              s.radius,
              s.object,
              s.force,
              a
            );
            agents.push(...generatedObject);
          }
        }
      }
    }

    const nearest = (agent: IAgent) => {
      if (agent.type === 'car') {
        return services.drive.nearest({ coordinates: [agent.actual.coord] });
      }
      if (agent.type === 'bicycle') {
        return services.cycle.nearest({ coordinates: [agent.actual.coord] });
      }
      return services.walk.nearest({ coordinates: [agent.actual.coord] });
    };

    for (const agent of agents) {
      const transport = agent.type === 'car' || agent.type === 'bicycle';
      if (transport) {
        const coord = (await nearest(agent)).waypoints[0].location;
        if (coord) {
          agent.actual.coord = coord;
        }
      }
    }


    services.agents = agents.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {} as { [id: string]: IAgent });

    const equipmentsForAgents = simConfig.hasEquipment;
    console.log('eqqq', equipmentsForAgents)

    for (const key in equipmentsForAgents) {
      if (equipmentsForAgents.hasOwnProperty(key)) {

        const agentIdArray = equipmentsForAgents[key] as any[];
        const agentArray = agentIdArray.map(a => a = services.agents[a]);

        agentArray.forEach(a => {
          if (a.equipment) {
            a.equipment.push(services.equipments[key])
          }
          else {
            a.equipment = [services.equipments[key]]
          }
        });
      }
    }

    /** Insert members of subgroups into groups */
    const groups = agents.filter((g) => g.group);
    groups.map((g) => g.group ? g.group.map((a) => addGroup(services.agents[a], g, services)) : '');


    /** add members that or not generated to groups */
    const groupType = agents.filter((g) => g.type === 'group');
    for (const g of groupType) {
      if (!g.group) {
        g.group = [];
      }
      if (!g.memberCount) {
        g.memberCount = 0;
      }
      if (g.group && g.memberCount) {
        const extraMembers = g.memberCount - g.group.length;
        for (let j = 0; j < extraMembers; j++) {
          const id = String(j) + g.id;
          g.group.push(id);
        }
      }
    }

    /** Agent types that never control itself */
    const passiveTypes = ['car', 'bicycle', 'object'];
    await redisServices.geoAddBatch('agents', agents);

    /** Send message to agents in range, if reaction exists */
    const intervalObj = setInterval(async () => {
      await Promise.all(
        agents
          .filter(
            (a) =>
              a.agenda &&
              a.agenda[0] &&
              a.agenda[0].name &&
              reaction[a.agenda[0].name] &&
              a.agenda[0].name !== 'Call the police' &&
              a.agenda[0].name !== 'Walk to person'
          )
          .map((a) => messageServices.sendMessage(a, a.agenda![0].name, services))
      );
    }, 10000);

    // const chatInterval = setInterval(async () => {
    //   const chattingAgents = agents.filter(a => a.agenda && a.agenda[0] && a.agenda[0].name === 'Chat');

    //   if (chattingAgents.length <= agents.length * 0.01)
    //     chatServices.agentChat(agents, services);
    // }, 100000);

    let i = 0;
    while (i < 1000000000) {
      await Promise.all(
        agents
          .filter(
            (a) =>
              passiveTypes.indexOf(a.type) < 0 &&
              !a.memberOf &&
              a.mailbox &&
              a.mailbox.length > 0 &&
              (!a.health || a.health > 0) &&
              a.status !== 'inactive'
          )
          .map((a) => messageServices.readMailbox(a, services, agents))
      );
      await Promise.all(
        agents
          .filter(
            (a) =>
              passiveTypes.indexOf(a.type) < 0 &&
              a.type === 'group' &&
              a.mailbox &&
              a.mailbox.length > 0 &&
              (!a.health || a.health > 0) &&
              a.status !== 'inactive'
          )
          .map((a) => messageServices.readMailbox(a, services, agents))
      );
      await Promise.all(
        agents
          .filter(
            (a) =>
              passiveTypes.indexOf(a.type) < 0 &&
              !a.memberOf &&
              a.health &&
              a.health > 0 &&
              a.status !== 'inactive'
          )
          .map((a) => updateAgent(a, services, agents))
      );
      updateTime();
      await sleep(100);
      i % 5 === 0 && notifyOthers();
      // i % 25 === 0 && console.log(services.getTime());
      i++;
    }
  });
};

