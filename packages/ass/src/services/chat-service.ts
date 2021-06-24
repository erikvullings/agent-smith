import { IEnvServices } from '../env-services';
import { ActivityList, IAgent } from '../models';
import { toTime, randomIntInRange } from '../utils';
import { redisServices } from './redis-service';


/**
 * @param agent
 * @param agents
 * @param services
 * Picks one random agent and the closest agent
 */

const agentChat = async (agents: IAgent[], services: IEnvServices) => {
    const randomAgentStart = agents[randomIntInRange(0, agents.length)];
    if (randomAgentStart) {
        const redisAgents: any[] = await redisServices.geoSearch(randomAgentStart.actual, 10000);
        const availableAgents: IAgent[] = (redisAgents.map((a) => a = services.agents[a.key]))
            .filter(a => a.agenda && a.agenda[0] && (!a.agenda[0].options?.reacting || a.agenda[0].options?.reacting !== true)
                && (!('baseLocation' in a) || services.locations[a.baseLocation].type !== ('police station' || 'sis base')) && a.status !== 'inactive' &&
                a.force !== 'red' &&
                a.force !== 'tbp' &&
                (a.type === 'woman' || 'man' || 'girl' || 'boy') &&
                (!a.steps || (a.steps[0].name !== 'driveTo' || 'cycleTo')));

        const randomAgent: IAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
        const closeRedis = (await redisServices.geoSearch(randomAgent.actual, 10) as any[]).filter(a => a.key !== randomAgent.id);;
        const closeAgents = closeRedis.map(a => a = services.agents[a.key]);

        if (closeAgents.length > 0) {
            const closeAgent: IAgent = closeAgents[0];
            randomAgent.following = closeAgent.id;

            startChat(randomAgent, closeAgent, services);
        }
    }
    return true;
};

/**
 * @param randomAgent
 * @param closeAgent
 * @param services
 * Adds going to the meetup location and chatting steps in the agendas
 * @param agents
 */

const startChat = async (randomAgent: IAgent, closeAgent: IAgent, services: IEnvServices) => {
    randomAgent.route = [];
    randomAgent.steps = [];
    randomAgent.following = closeAgent.id;

    const timesim = services.getTime();
    timesim.setSeconds(timesim.getSeconds() + 1);
    randomAgent.following = closeAgent.id;

    const newAgenda1: ActivityList = [{ name: 'Walk to person', options: { startTime: toTime(timesim.getHours(), timesim.getMinutes(), timesim.getSeconds()), priority: 1, destination: closeAgent.actual } },
    { name: 'Chat', options: { priority: 2 } }];

    if (randomAgent.agenda) {
        randomAgent.agenda = [...newAgenda1, ...randomAgent.agenda];
    }
    else {
        randomAgent.agenda = [...newAgenda1];
    }
};

export const chatServices = {
    startChat,
    agentChat,
};