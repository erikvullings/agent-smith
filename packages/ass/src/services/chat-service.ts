import { IEnvServices, updateAgent } from '../env-services';
import { ActivityList, IAgent } from '../models';
import { agentToEntityItem, minutes, random, randomIntInRange } from '../utils';
import { messageServices } from './message-service';
import { redisServices } from './redis-service';

/**
 * @param agent
 * @param agents
 * @param services
 * Picks one random agent and the closest agent
 */

const agentChat = async (agents: IAgent[], services: IEnvServices) => {

    const redisAgents: any[] = await redisServices.geoSearch(agents[randomIntInRange(0,agents.length)].actual, 10000);

    const availableAgents: IAgent[] = (redisAgents.map((a) => a = services.agents[a.key]))
        .filter(a => a.agenda && a.agenda[0] && (!a.agenda[0].options?.reacting || a.agenda[0].options?.reacting !== true)
            && (!('baseLocation' in a) || a.baseLocation !== 'station') && a.status !== 'inactive' &&
            (!a.visibleForce || a.visibleForce !== 'red') &&
            a.force !== 'tbp' &&
            (a.type === 'woman' || 'man' || 'girl' || 'boy'));
    // && a.steps[0].name != 'driveTo' || 'cycleTo'

    // const randomAgent: IAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
    // eslint-disable-next-line dot-notation
    const randomAgent = services.agents['whiteAgent'];
    console.log('random agent1', randomAgent)
    const closeRedis = (await redisServices.geoSearch(randomAgent.actual, 10000) as any[]).filter(a => a.key !== randomAgent.id);;

    const closeAgents = closeRedis.map(a => a = services.agents[a.key]);


    if (closeAgents.length > 0) {
        const closeAgent: IAgent = closeAgents[0];
        console.log('random agent2', closeAgent)
        randomAgent.following = closeAgent.id;
        // await startChat(randomAgent, closeAgent, services);
        // eslint-disable-next-line dot-notation
        messageServices.sendDirectMessage(services.agents['police3'],'Walk to person',[randomAgent],services)
    }
    return true;
};

/**
 * @param randomAgent
 * @param closeAgent
 * @param services
 * Adds going to the meetup location and chatting steps in the agendas
 */
const startChat = async (randomAgent: IAgent, closeAgent: IAgent, services: IEnvServices) => {
    const timesim = services.getTime();
    timesim.setMinutes(timesim.getMinutes() + 5);
    randomAgent.following = closeAgent.id;

    const newAgenda1: ActivityList = [{ name: 'Walk to person', options: { startTime: timesim, priority: 1, destination: closeAgent.actual } },
    { name: 'Chat', options: { priority: 2 } }];

    if(randomAgent.agenda){
        randomAgent.agenda = [...newAgenda1, ...randomAgent.agenda];
    }
    else{
        randomAgent.agenda = [...newAgenda1];
    }
};

export const chatServices = {
    startChat,
    agentChat,
};