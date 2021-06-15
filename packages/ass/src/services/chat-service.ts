import { IEnvServices, updateAgent } from '../env-services';
import { ActivityList, IAgent } from '../models';
import { minutes, toTime } from '../utils';
import { redisServices } from './redis-service';


/**
 * @param agent
 * @param agents
 * @param services
 * Picks one random agent and the closest agent
 */

const agentChat = async (agents: IAgent[], services: IEnvServices) => {
    const redisAgents: any[] = await redisServices.geoSearch(services.locations.station, 10000);

    const availableAgents: IAgent[] = (redisAgents.map((a) => a = services.agents[a.key]))
        .filter(a => a.agenda && a.agenda[0] && (!a.agenda[0].options?.reacting || a.agenda[0].options?.reacting !== true)
            && (!('baseLocation' in a) || a.baseLocation !== 'station') && a.status !== 'inactive' &&
            (!a.visibleForce || a.visibleForce !== 'red'));
    // && a.steps[0].name != 'driveTo' || 'cycleTo'

    const randomAgent: IAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
    console.log('random agent1', randomAgent)
    const closeAgents = (await redisServices.geoSearch(randomAgent.actual, 1000) as any[]).filter(a => a.key !== randomAgent.id);;

    if (closeAgents.length > 0) {
        const closeAgent: IAgent = closeAgents[0];
        console.log('random agent2', closeAgent)

        startChat(randomAgent, closeAgent, services, agents);
    }
};

/**
 * @param randomAgent
 * @param closeAgent
 * @param services
 * Adds going to the meetup location and chatting steps in the agendas
 * @param agents
 */
const startChat = async (randomAgent: IAgent, closeAgent: IAgent, services: IEnvServices, agents: IAgent[]) => {
    if (randomAgent.agenda !== undefined && closeAgent.agenda !== undefined) {
        closeAgent.route = [];
        closeAgent.steps = [];

        randomAgent.route = [];
        randomAgent.steps = [];

        randomAgent.destination = closeAgent.actual;
        closeAgent.destination = undefined;

        const timesim = services.getTime();
        timesim.setSeconds(timesim.getSeconds() + 1);
        const startTime = toTime(timesim.getHours(), timesim.getMinutes(), timesim.getSeconds());

        const chatDuration = minutes(2, 15);

        const newAgenda1: ActivityList = [{ name: 'Go to specific location', options: { startTime, priority: 1, destination: closeAgent.actual, duration: minutes(5, 5) } },
        { name: 'Chat', options: { priority: 2, duration: chatDuration } }];
        randomAgent.agenda = [...newAgenda1, ...randomAgent.agenda];

        const newAgenda2: ActivityList = [{ name: 'Wait', options: { startTime, priority: 1, duration: minutes(5, 5) } },
        { name: 'Chat', options: { priority: 2, duration: chatDuration } }];
        closeAgent.agenda = [...newAgenda2, ...closeAgent.agenda];

        console.log('agenda1', randomAgent.agenda)
        console.log('agenda2', closeAgent.agenda)

        console.log('agent1.steps.length', randomAgent.steps.length)
        console.log('agent1.agenda.length', randomAgent.agenda.length)

        updateAgent(closeAgent, services, agents);
        updateAgent(randomAgent, services, agents);
    }
};

export const chatServices = {
    startChat,
    agentChat,
};