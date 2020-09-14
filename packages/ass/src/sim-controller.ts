import { envServices, updateAgent } from './env-services';
import { TestBedAdapter, LogLevel, ProduceRequest } from 'node-test-bed-adapter';
import { IAgent } from './models/agent';
import { uuid4, simTime, log, agentToEntityItem } from './utils';

const SimEntityItemTopic = 'simulation_entity_item';

export const simController = async (
  options: {
    /** Simulation speed. 0 is paused, 1 is real-time. */
    simSpeed?: number;
    startTime?: Date;
  } = {}
) => {
  createAdapter(async (tb) => {
    const { simSpeed = 0.5, startTime = simTime(0, 6) } = options;
    const services = envServices();
    const agents = [] as IAgent[];

    let currentSpeed = simSpeed;
    let currentTime = startTime;

    const updateTime = () => {
      currentTime = new Date(currentTime.valueOf() + 1000 * currentSpeed);
      services.setTime(currentTime);
    };

    const notifyOthers = () => {
      const payload: ProduceRequest[] = agents.map((a) => ({
        topic: SimEntityItemTopic,
        messages: agentToEntityItem(a),
      }));
      tb.send(payload, (error) => error && log(error));
    };

    services.locations = {
      huisarts: {
        type: 'medical',
        coord: [5.490361, 51.457513],
      },
      tue_innovation_forum: {
        type: 'work',
        coord: [5.486752, 51.446421],
      },
      'Firmamentlaan 5': {
        type: 'home',
        coord: [5.496994, 51.468701],
      },
    };

    const agent1 = {
      id: uuid4(),
      type: 'man',
      // speed: 1.4,
      status: 'active',
      home: services.locations['Firmamentlaan 5'],
      owns: [],
      actual: services.locations['Firmamentlaan 5'],
      occupations: [{ type: 'work', id: 'tue_innovation_forum' }],
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

    agents.push(agent1, car);
    services.agents = agents.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {} as { [id: string]: IAgent });

    /** Agent types that never control itself */
    const passiveTypes = ['car', 'bicycle'];

    let i = 0;
    while (i < 100000) {
      await Promise.all(
        agents.filter((a) => passiveTypes.indexOf(a.type) < 0 && !a.memberOf).map((a) => updateAgent(a, services))
      );
      updateTime();
      // await sleep(20);
      i % 2 === 0 && notifyOthers();
      i++;
      
    }
  });
};

// function sleep(ms: number) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//   });
// }   


/** Connect to Kafka and create a connector */
const createAdapter = (callback: (tb: TestBedAdapter) => void) => {
  const tb = new TestBedAdapter({
    kafkaHost: process.env.KAFKA_HOST || 'localhost:3501',
    schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
    clientId: 'agent-smith',
    produce: [SimEntityItemTopic],
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
