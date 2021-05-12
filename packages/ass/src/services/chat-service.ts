import { IEnvServices, updateAgent } from '../env-services';
import { ActivityList, IAgent, ILocation } from '../models';
import { minutes } from '../utils';
import { redisServices } from './redis-service';

/** Picks one random agent and the closest agent */
const agentChat = async (agents: Array<IAgent>, services: IEnvServices) => {
    const redisAgents = await redisServices.geoSearch(services.locations['station'], 10000) as Array<any>;

    const availableAgents = (redisAgents.map((a) => a = services.agents[a.key]))
          .filter(a => a.agenda && a.agenda[0] && (!a.agenda[0].options?.reacting || a.agenda[0].options?.reacting != true) 
                  && (!("department" in a) || a.department != 'station') && a.status != "inactive" && 
                  (!a.visibleForce || a.visibleForce != 'red') );
                  //&& a.steps[0].name != 'driveTo' || 'cycleTo'
                
    const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)] as IAgent;
    console.log("random agent1",randomAgent)
    const closeAgents = (await redisServices.geoSearch(randomAgent.actual, 1000) as Array<any>).filter(a => a.key != randomAgent.id);;
    
    if(closeAgents.length > 0){
      const closeAgent = closeAgents[0] as IAgent;
      console.log("random agent2",closeAgent)

      startChat(randomAgent, closeAgent, services);
      }
  }

/** Adds going to the meetup location and chatting steps in the agendas */
const startChat = async (randomAgent: IAgent, closeAgent: IAgent, services: IEnvServices) => {
   if(randomAgent.agenda != undefined && closeAgent.agenda != undefined){
    closeAgent.route = [];
    closeAgent.steps = [];

    randomAgent.route = [];
    randomAgent.steps = [];

    randomAgent.destination = closeAgent.actual;
    closeAgent.destination = undefined;

    let timesim = services.getTime();
    timesim.setMinutes(timesim.getMinutes()+ 5);

    let chatDuration = minutes(2, 15);

    var newAgenda1 : ActivityList = [{name: 'Go to specific location', options: { startTime: timesim, priority: 1, destination: closeAgent.actual, duration: minutes(5,5) }},
                                    { name: 'Chat', options: { priority: 2, duration: chatDuration } }];
    randomAgent.agenda = [...newAgenda1,...randomAgent.agenda];

    var newAgenda2 : ActivityList = [{name: 'Wait', options: { startTime: timesim, priority: 1, duration: minutes(5,5) }},
                                    { name: 'Chat', options: { priority: 2, duration: chatDuration } }];
    closeAgent.agenda = [...newAgenda2,...closeAgent.agenda];

    console.log("agenda1",randomAgent.agenda)
    console.log("agenda2",closeAgent.agenda)

    console.log("agent1.steps.length",randomAgent.steps.length)
    console.log("agent1.agenda.length",randomAgent.agenda.length)

    updateAgent(closeAgent,services);
    updateAgent(randomAgent,services);
    }
};

export const chatServices = {
    startChat,
    agentChat
};