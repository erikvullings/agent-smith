import { envServices, updateAgent } from './env-services';
import { TestBedAdapter, LogLevel } from 'node-test-bed-adapter';
import { IAgent } from './models/agent';
import { uuid4, simTime, log, sleep, generateAgents, agentToFeature } from './utils';
import { redisServices } from './services';

// const SimEntityItemTopic = 'simulation_entity_item';
const SimEntityFeatureCollectionTopic = 'simulation_entity_featurecollection';

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
    const agents = [] as IAgent[];

    let currentSpeed = simSpeed;
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
        coord: [5.487755, 51.454860],
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
      park: {
        type: 'park',
        coord: [5.497535, 51.441965],
      }
    };

    const agent1 = {
      id: uuid4(),
      type: 'man',
      // speed: 1.4,
      status: 'active',
      home: services.locations['Firmamentlaan 5'],
      owns: [{ type: 'car', id: 'car1' }],
      actual: services.locations['Firmamentlaan 5'],
      occupations: [{ type: 'work', id: 'tue_innovation_forum' }],
    } as IAgent;

    const agent2 = {
      id: uuid4(),
      type: 'man',
      status: 'active',
      home: services.locations['Monarchstraat 52'],
      owns: [{ type: 'bicycle', id: 'bicycle1' }],
      actual: services.locations['Monarchstraat 52'],
      occupations: [{ type: 'shop', id: 'h_m_shop' }],
    } as IAgent;

    const agent3 = {
      id: uuid4(),
      type: 'man',
      status: 'active',
      home: services.locations['Antoon Derkinderenstraat 17'],
      actual: services.locations['Antoon Derkinderenstraat 17'],
      occupations: [{ type: 'wander', id: 'park' }],
    } as IAgent;

    const agent4 = {
      id: uuid4(),
      type: 'woman',
      status: 'active',
      owns: [{ type: 'car', id: 'car2' }],
      home: services.locations['Antoon Derkinderenstraat 17'],
      actual: services.locations['Antoon Derkinderenstraat 17'],
      occupations: [{ type: 'doctor_visit', id: 'ziekenhuis' }],
    } as IAgent;

    const car = {
      id: 'car1',
      type: 'car',
      status: 'active',
      actual: {
        type: 'home',
        coord: (
          await services.drive.nearest({
            coordinates: [services.locations['Firmamentlaan 5'].coord],
          })
        ).waypoints[0].location,
      },
    } as IAgent;

    const car2 = {
      id: 'car2',
      type: 'car',
      status: 'active',
      actual: {
        type: 'home',
        coord: (
          await services.drive.nearest({
            coordinates: [services.locations['Antoon Derkinderenstraat 17'].coord],
          })
        ).waypoints[0].location,
      },
    } as IAgent;

    const bicycle = {
      id: 'bicycle1',
      type: 'bicycle',
      status: 'active',
      actual: {
        type: 'home',
        coord: (
          await services.cycle.nearest({
            coordinates: [services.locations['Monarchstraat 52'].coord],
          })
        ).waypoints[0].location,
      },
    } as IAgent;

    const agentCount = 6;
    const { agents: generatedAgents, locations } = generateAgents(5.476543, 51.440208, agentCount);
    agents.push(agent1, agent2, agent3, agent4, car, car2, bicycle, ...generatedAgents);
    services.locations = Object.assign({}, services.locations, locations);
    services.agents = agents.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {} as { [id: string]: IAgent });

    /** Agent types that never control itself */
    const passiveTypes = ['car', 'bicycle'];

    await redisServices.geoAddBatch('agents', [agent1,agent2,agent3,agent4]);

    let i = 0;
    while (i < 10000000) {
      await Promise.all(
        agents.filter((a) => passiveTypes.indexOf(a.type) < 0 && !a.memberOf).map((a) => updateAgent(a, services))
      );
      updateTime();
      await sleep(100);
      i % 5 === 0 && notifyOthers();
      i++;
    }
  });
};

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
