import { envServices, updateAgent } from './env-services';
import { TestBedAdapter, LogLevel } from 'node-test-bed-adapter';
import { IAgent } from './models/agent';
import { uuid4, simTime, log, sleep, generateAgents, agentToFeature } from './utils';
import { IGroup } from './models/group';
import { redisServices } from './services';
import * as jsonSimConfig from "./sim_config.json"
import { ISimConfig } from './models';

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
    let agentstoshow = [] as IAgent[];
    const simConfig = jsonSimConfig as ISimConfig;
    const agents : Array<IAgent> = simConfig.customAgents;

    console.log("adapter",agents)

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
      },
      'station': {
        type: 'station',
        coord: [5.479549, 51.443012],
      },
      'Ingmar B.V.': {
        type: 'work',
        coord : [5.497604, 51.467525]
      },
      'Verweg': {
        type: 'work',
        coord : [5.576614, 51.383969]
      },
    };

  
    // /** Agents in groups */

    // const agentx = {
    //   id: 'agent x',
    //   type: 'man',
    //   status: 'active',
    //   home: services.locations['Firmamentlaan 5'],
    //   actual: services.locations['Firmamentlaan 5'],
    //   occupations: [{ type: 'work', id: 'h_m_shop'  }],
    //   memberOf: 'group2'
    // } as IAgent;

    // const agenty = {
    //   id: 'agent y',
    //   type: 'man',
    //   status: 'active',
    //   home: services.locations['Firmamentlaan 5'],
    //   actual: services.locations['Firmamentlaan 5'],
    //   occupations: [{  type: 'work', id: 'tue_innovation_forum' }],
    //   memberOf: 'group2'
    // } as IAgent;

    // const agenta = {
    //   id: 'agenta',
    //   type: 'boy',
    //   status: 'active',
    //   home: services.locations['Monarchstraat 52'],
    //   actual: services.locations['Firmamentlaan 5'],
    //   occupations: [{ type: 'work', id: 'h_m_shop'  }],
    //   memberOf: 'group2'
    // } as IAgent;

    // const group2 = {
    //   id: 'group2',
    //   type: 'group',
    //   status: 'active',
    //   home: services.locations['Firmamentlaan 5'],
    //   actual: services.locations['Firmamentlaan 5'],
    //   occupations: [{ type: 'work', id: 'ziekenhuis' }],
    //   force: "blue",
    //   group: ['agent x', 'agenta', 'agent y'],
    // } as IGroup;

    // const group1 = {
    //   id: 'group1',
    //   type: 'group',
    //   status: 'active',
    //   force: 'blue',
    //   home: services.locations['Firmamentlaan 5'],
    //   actual: services.locations['Firmamentlaan 5'],
    //   occupations: [{ type: 'work', id: 'h_m_shop' }],
    //   memberOf: 'group2',
    // } as IGroup;

    /** Agents in force */
    // const white1 = {
    //   id: 'white1',
    //   type: 'woman',
    //   status: 'active',
    //   force: 'white',
    //   home: services.locations['Antoon Derkinderenstraat 17'],
    //   actual: services.locations['Antoon Derkinderenstraat 17'],
    //   occupations: [{ type: 'work', id: 'park' }],
    //   relations: [{type:'family', id:'fam1'}] ,
    // } as IAgent;

    // const blue1 = {
    //   id: 'blue1',
    //   type: 'girl',
    //   status: 'active',
    //   force: 'blue',
    //   home: services.locations['Antoon Derkinderenstraat 17'],
    //   actual: services.locations['Antoon Derkinderenstraat 17'],
    //   occupations: [{ type: 'work', id: 'h_m_shop' }],
    //   relations: [{type:'family', id:'fam1'}] ,
    // } as IAgent;

    // const red1 = {
    //   id: 'red1',
    //   type: 'boy',
    //   status: 'active',
    //   force: 'red',
    //   home: services.locations['Antoon Derkinderenstraat 17'],
    //   actual: services.locations['Antoon Derkinderenstraat 17'],
    //   occupations: [{ type: 'work', id: 'station' }],
    //   relations: [{type:'family', id:'fam1'}] ,
    // } as IAgent;


    const agentCount = simConfig.settings.agentCount;
    const { agents: generatedAgents, locations } = generateAgents(simConfig.settings.center_coord[0], simConfig.settings.center_coord[1], agentCount,simConfig.settings.radius);


    //agents.push(group1, group2, agenta, agentx, agenty, ...generatedAgents);
    agents.push( ...generatedAgents);
    
    agents.filter((a) => a.type == 'car').map(async (a) => a.actual.coord = (await services.drive.nearest({ coordinates: [a.actual.coord] }) ).waypoints[0].location),
    agents.filter((a) => a.type == 'bicycle').map(async (a) => a.actual.coord = (await services.cycle.nearest({ coordinates: [a.actual.coord] }) ).waypoints[0].location),

    services.locations = Object.assign({}, services.locations, locations);
    services.agents = agents.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {} as { [id: string]: IAgent });

    /** Agent types that never control itself */
    const passiveTypes = ['car', 'bicycle'];
    await redisServices.geoAddBatch('agents', agents);

    const intervalObj = setInterval(async () => {
       let testArr = await redisServices.geoSearch(services.locations['station'], '3000');
      // console.log(testArr);
      //var t2 = performance.now()

      const random = Math.floor(Math.random() * testArr.length);
      var agentRand : IAgent = agents[(agents.findIndex(x => x.id === testArr[random].key))];

      console.log("random agenda",agentRand.agenda)

      if(agentRand.agenda != undefined && agentRand.agenda[1].options?.priority && 1 < agentRand.agenda[1].options?.priority){
        agentRand.agenda?.splice(1,0,{ name: 'Wander', options: { priority: 3 } })
        console.log(agentRand.agenda)
      }
     // console.log("random agent",agentRand);
      //let resp = await redisServices.geoSearch(agentRand.actual,'10',agentRand);
      //console.log("response",resp);

      // if(resp.length > 0) {
      //     console.log("chosen agents is: " , resp[0])
      // }

      //var t3 = performance.now()
      //console.log("interval took " + (t3 - t2) + " milliseconds.")
    }, 30000);
      
    let i = 0;
    while (i < 10000000) {
      agentstoshow = [];
      agents.filter((a) => !a.memberOf).map((a) => agentstoshow.push(a)),
      await Promise.all(
      agents.filter((a) => passiveTypes.indexOf(a.type) < 0 && !a.memberOf).map((a) => updateAgent(a, services)),
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
