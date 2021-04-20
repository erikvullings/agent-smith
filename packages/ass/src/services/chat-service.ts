import { IEnvServices } from '../env-services';
import { ActivityList, IAgent, ILocation } from '../models';
import { minutes } from '../utils';
import { redisServices } from './redis-service';

/** Picks one random agent and the closest agent */
const agentChat = async (agents: Array<IAgent>, services: IEnvServices) => {
    let redisAgents = await redisServices.geoSearch(services.locations['station'], '3000');
    var availableAgents : Array<IAgent> = []

    redisAgents.forEach((redisAgent: { key: string; }) => {
      var currAgent : IAgent = agents[(agents.findIndex(agent => agent.id === redisAgent.key))];
      if(currAgent.type != 'car' || 'bicycle' || 'bus' || 'train' && currAgent.steps != undefined 
          && currAgent.steps[0].name != 'driveTo' || 'cycleTo'){
          availableAgents.concat(currAgent);
      }
    });
  
    const random = Math.floor(Math.random() * availableAgents.length);
    var randomAgent : IAgent = availableAgents[random];
    console.log("random agent1",randomAgent)
    let closeAgents: Array<any> = await redisServices.geoSearch(randomAgent.actual, '1000');

    closeAgents = closeAgents.filter(function(agent) {
      return agent.key != randomAgent.id;
    });      
    
    if(closeAgents.length > 0){
      console.log("type", closeAgents[0].key)

      var closeAgent : IAgent = agents[(agents.findIndex(agent => agent.id === closeAgents[0].key))];
      console.log("random agent2",closeAgent)

      await chatServices.startChat(randomAgent, closeAgent, services);
      }
  }

/** Adds going to the meetup location and chatting steps in the agendas */
const startChat = async (randomAgent: IAgent, closeAgent: IAgent, services: IEnvServices) => {
    var destinationCoord: ILocation = {type: "road",
    coord: [(randomAgent.actual.coord[0]+closeAgent.actual.coord[0])/2,
    (randomAgent.actual.coord[1]+closeAgent.actual.coord[1])/2]};
    console.log(destinationCoord);

   if(randomAgent.agenda != undefined && closeAgent.agenda != undefined){
    randomAgent.destination = destinationCoord;
    closeAgent.destination = destinationCoord;

    let timesim = services.getTime();
    timesim.setMinutes(timesim.getMinutes()+ 2);

    let chatDuration = minutes(2, 15);

    var newAgenda1 : ActivityList = [{name: 'Go to specific location', options: { startTime: timesim, priority: 1, destination: destinationCoord }},
                                    { name: 'Chat', options: { priority: 2, duration: chatDuration } }];
    randomAgent.agenda = newAgenda1.concat(randomAgent.agenda);

    var newAgenda2 : ActivityList = [{name: 'Go to specific location', options: { startTime: timesim, priority: 1, destination: destinationCoord }},
                                    { name: 'Chat', options: { priority: 2, duration: chatDuration } }];
    closeAgent.agenda = newAgenda2.concat(closeAgent.agenda);

    console.log("agenda1",randomAgent.agenda)
    console.log("agenda2",closeAgent.agenda)
    }
};

export const chatServices = {
    startChat,
    agentChat
};