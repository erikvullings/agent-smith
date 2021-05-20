import { TestBedAdapter, LogLevel } from 'node-test-bed-adapter';
import { envServices, updateAgent } from './env-services';
import { IAgent, TransportType, ObjectType } from './models';
import { addGroup, uuid4, simTime, log, sleep, generateAgents, agentToFeature, agentToEntityItem } from './utils';
import { redisServices, messageServices, reaction, chatServices } from './services';
import { IReactions, ISimConfig } from './models';
import { IDefenseAgent } from './models/defense-agent';
//import jsonSimConfig2 from './sim_config.json';
import jsonSimConfig from './verstoring_openbare_orde.json';
import reactionConfig from './plan_reactions.json';
import { IThreatAgent } from './models/threat-agent';

// const SimEntityItemTopic = 'simulation_entity_item';
const SimEntityFeatureCollectionTopic = 'simulation_entity_featurecollection';

//export const simConfig2 = (jsonSimConfig2 as unknown) as ISimConfig;
export const simConfig = (jsonSimConfig as unknown) as ISimConfig;
export const { customAgendas } = simConfig;
export const { customTypeAgendas } = simConfig;

/** Connect to Kafka and create a connector */
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
    const { simSpeed = 10, startTime = simTime(0, 6) } = options;
    const services = envServices({ latitudeAvg: 51.4 });
    //const agentstoshow = [] as IAgent[];

    const reactionImport: IReactions = reactionConfig;

    if (reactionImport) {
      for (const key in reactionImport) {
        reaction[key] = reactionImport[key];
      }
    }

    console.log("call the police", reaction["Call the police"])
    console.log("test", reaction["Run away"])

    const blueAgents: (IAgent & IDefenseAgent)[] = simConfig.customAgents.blue;
    const redAgents: IAgent[] = simConfig.customAgents.red;
    const whiteAgents: IAgent[] = simConfig.customAgents.white;
    const whiteGroups: IAgent[] = simConfig.customAgents.whiteGroups;

    const agents = [...blueAgents, ...redAgents, ...whiteAgents, ...whiteGroups] as (IAgent | IDefenseAgent | IThreatAgent)[];

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

    services.locations = {
      ziekenhuis: {
        type: 'medical',
        coord: [5.487755, 51.45486],
      },
      tue_innovation_forum: {
        type: 'work',
        coord: [5.486752, 51.446421],
      },
      'Firmamentlaan 5': {
        type: 'home',
        coord: [5.496994, 51.468701],
      },
      'Monarchstraat 52': {
        type: 'home',
        coord: [5.521275, 51.448302],
      },
      'Antoon Derkinderenstraat 17': {
        type: 'home',
        coord: [5.499309, 51.437832],
      },
      h_m_shop: {
        type: 'work',
        coord: [5.476234, 51.442025],
      },
      mc_donalds: {
        type: 'work',
        coord: [5.476625, 51.441021],
      },
      park1: {
        type: 'park',
        coord: [5.497535, 51.441965],
      },
      park2: {
        type: 'park',
        coord: [5.482012, 51.426585],
      },
      station: {
        type: 'station',
        coord: [5.479549, 51.443012],
      },
      'police station': {
        type: 'police station',
        coord: [5.499089, 51.437034],
      },
      bijenkorf: {
        type: 'work',
        coord: [5.477151, 51.441586],
      },
      wilhelminaplein: {
        type: 'parking lot',
        coord: [5.470759, 51.437697],
      },
      bioscoop: {
        type: 'cinema',
        coord: [5.477744, 51.437028],
      },
      'Ingmar B.V.': {
        type: 'work',
        coord: [5.497604, 51.467525],
      },
      Verweg: {
        type: 'work',
        coord: [5.576614, 51.383969],
      },
    };


    const { agentCount } = simConfig.settings;
    const { agents: generatedAgents, locations } = generateAgents(
      simConfig.settings.centerCoord[0],
      simConfig.settings.centerCoord[1],
      agentCount,
      simConfig.settings.radius,
      simConfig.settings.type,
      simConfig.settings.force,
    );

    agents.push(...generatedAgents);

    if (simConfig.settings.object) {
      for (const a of generatedAgents) {
        const { agents: generatedObject } = generateAgents(
          simConfig.settings.centerCoord[0],
          simConfig.settings.centerCoord[1],
          1,
          simConfig.settings.radius,
          simConfig.settings.object,
          simConfig.settings.force,
          a
        );
        agents.push(...generatedObject);
      }
    }



    //const { agents: generatedPolice } = generatePolice(services.locations['police station'].coord[0], services.locations['police station'].coord[1], 5, 0);
    const membersConfig = simConfig.settings.groupMembers;

    if (whiteGroups && membersConfig) {
      for (const g of whiteGroups) {
        const { agents: generatedAgentsGroup } = generateAgents(
          simConfig.settings.centerCoord[0],
          simConfig.settings.centerCoord[1],
          membersConfig,
          simConfig.settings.radius,
          "man",
          "white",
          g
        );
        agents.push(...generatedAgentsGroup);
      }
    }


    agents.filter((a) => a.type == 'car').map(async (a) => a.actual.coord = (await services.drive.nearest({ coordinates: [a.actual.coord] })).waypoints[0].location);
    agents.filter((a) => a.type == 'bicycle').map(async (a) => a.actual.coord = (await services.cycle.nearest({ coordinates: [a.actual.coord] })).waypoints[0].location);

    // const nearest = {
    //   car: services.drive.nearest,
    //   bicycle: services.cycle.nearest,
    //   walk: services.walk.nearest,
    //   bus: services.drive.nearest, // fake
    //   train: services.drive.nearest, // fake
    // };
    // for (const agent of agents) {
    //   const transportType = typeof agent.type === 'string' && (agent.type as TransportType);
    //   if (!transportType || !['car', 'bicycle', 'walk'].indexOf(transportType)) continue;
    //   const coord = (await nearest[transportType]({ coordinates: [agent.actual.coord] })).waypoints[0]
    //     .location;
    //   if (!coord) continue;
    //   agent.actual.coord = coord;
    // }

    // Drie opmerkingen:
    // - je loopt hier 2x over dezelfde lijst.
    // - de .map function werkt niet met async/await
    // - de location can undefined zijn, en dat gaf een TS error
    // Zie ook https://advancedweb.hu/how-to-use-async-functions-with-array-map-in-javascript/
    // agents
    //   .filter((a) => a.type == 'car')
    //   .map(
    //     async (a) =>
    //       (a.actual.coord = (
    //         await services.drive.nearest({ coordinates: [a.actual.coord] })
    //       ).waypoints[0].location)
    //   );
    // agents
    //   .filter((a) => a.type == 'bicycle')
    //   .map(
    //     async (a) =>
    //       (a.actual.coord = (
    //         await services.cycle.nearest({ coordinates: [a.actual.coord] })
    //       ).waypoints[0].location)
    //   );

    services.locations = { ...services.locations, ...locations };
    services.agents = agents.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {} as { [id: string]: IAgent | IDefenseAgent });


    /** Insert members of subgroups into groups */
    const groups = agents.filter((g) => g.group);
    groups.map((g) => (g.group ? (g.memberCount = [...g.group]) : ''));
    groups.map((g) => g.group ? g.group.map((a) => addGroup(services.agents[a], g, services)) : '');

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
              a.agenda[0].name !== 'Call the police'
          )
          .map((a) => messageServices.sendMessage(a, a.agenda![0].name, services))
      );
    }, 10000);

    // const chatInterval = setInterval(async () => {
    //   const chattingAgents = agents.filter(a => a.agenda && a.agenda[0] && a.agenda[0].name == 'Chat');

    //   if (chattingAgents.length <= agents.length * 0.01)
    //     chatServices.agentChat(agents, services);
    // }, 60000);

    let i = 0;
    while (i < 10000000) {
      await Promise.all(
        agents
          .filter(
            (a) =>
              passiveTypes.indexOf(a.type) < 0 &&
              !a.memberOf &&
              a.mailbox &&
              a.mailbox.length > 0 &&
              (!a.health || a.health > 0) &&
              a.status != 'inactive'
          )
          .map((a) => messageServices.readMailbox(a, services))
      );
      await Promise.all(
        agents
          .filter(
            (a) =>
              passiveTypes.indexOf(a.type) < 0 &&
              !a.memberOf &&
              a.health &&
              a.health > 0 &&
              a.status != 'inactive'
          )
          .map((a) => updateAgent(a, services))
      );
      updateTime();
      await sleep(100);
      i % 5 === 0 && notifyOthers();
      i++;
    }
  });
};

