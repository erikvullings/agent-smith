import { IEnvServices, updateAgent } from '../env-services';
import { ActivityList, IAgent, ILocation } from '../models';
import { minutes } from '../utils';
import { redisServices } from './redis-service';

* @param agents
* @param services
/** Picks one random agent and the closest agent */
const agentChat = async (agents: IAgent[], services: IEnvServices) => {
    const redisAgents = await redisServices.geoSearch(services.locations.station, '3000');
    const availableAgents : IAgent[] = []

    redisAgents.forEach((redisAgent: { key: string; }) => {
      const currAgent : IAgent = agents[(agents.findIndex(agent => agent.id === redisAgent.key))];
      if(currAgent.type != 'car' || 'bicycle' || 'bus' || 'train' && currAgent.steps != undefined
          && currAgent.steps[0].name != 'driveTo' || 'cycleTo'){
          availableAgents.push(currAgent);
      }
    });

    const random = Math.floor(Math.random() * availableAgents.length);
    const randomAgent : IAgent = availableAgents[random];
    console.log('random agent1',randomAgent)
    let closeAgents: any[] = await redisServices.geoSearch(randomAgent.actual, '1000');

    closeAgents = closeAgents.filter((agent) => agent.key != randomAgent.id);

    if(closeAgents.length > 0){
      const closeAgent : IAgent = agents[(agents.findIndex(agent => agent.id === closeAgents[0].key))];
      console.log('random agent2',closeAgent)

      startChat(randomAgent, closeAgent, services);
      }
  }

* @param randomAgent
* @param closeAgent
* @param services
/** Adds going to the meetup location and chatting steps in the agendas */
const startChat = async (randomAgent: IAgent, closeAgent: IAgent, services: IEnvServices) => {
    // var destinationCoord: ILocation = {type: "road",
    // coord: [(randomAgent.actual.coord[0]+closeAgent.actual.coord[0])/2,
    // (randomAgent.actual.coord[1]+closeAgent.actual.coord[1])/2]} as ILocation;
    // console.log(destinationCoord);
    // console.log(services.locations['wilhelminaplein']);


   if(randomAgent.agenda != undefined && closeAgent.agenda != undefined){
    console.log('delete route', randomAgent.route)
    closeAgent.route = [];
    closeAgent.steps = [];

    randomAgent.route = [];
    randomAgent.steps = [];

    randomAgent.destination = closeAgent.actual;
    closeAgent.destination = undefined;

    const timesim = services.getTime();
    timesim.setMinutes(timesim.getMinutes()+ 5);

    const chatDuration = minutes(2, 15);

    const newAgenda1 : ActivityList = [{name: 'Go to specific location', options: { startTime: timesim, priority: 1, destination: closeAgent.actual, duration: minutes(5,5) }},
                                    { name: 'Chat', options: { priority: 2, duration: chatDuration } }];
    randomAgent.agenda = [...newAgenda1,...randomAgent.agenda];

    const newAgenda2 : ActivityList = [{name: 'Wait', options: { startTime: timesim, priority: 1, duration: minutes(5,5) }},
                                    { name: 'Chat', options: { priority: 2, duration: chatDuration } }];
    closeAgent.agenda = [...newAgenda2,...closeAgent.agenda];

    console.log('agenda1',randomAgent.agenda)
    console.log('agenda2',closeAgent.agenda)

    console.log('agent1.steps.length',randomAgent.steps.length)
    console.log('agent1.agenda.length',randomAgent.agenda.length)

    updateAgent(closeAgent,services);
    updateAgent(randomAgent,services);
    }
};

export const chatServices = {
    startChat,
    agentChat,
};