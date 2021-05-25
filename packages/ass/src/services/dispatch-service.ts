import { messageServices, redisServices } from '.';
import { IEnvServices } from '../env-services';
import { IAgent } from '../models';
import { planEffects } from './plan-effects';

const sendDefence = async (agent: IAgent, services: IEnvServices) => {
    console.log('hereee')
    let n = 0;

    if(agent.reactedTo === undefined || planEffects[agent.reactedTo] === undefined) {
        agent.reactedTo = 'drop object'; // To test function
    }

    const effect = planEffects[agent.reactedTo];

    if(effect) {
            const closeReceivers = (await redisServices.geoSearch(agent.actual, 1000, agent) as any[]).map((a) => a = services.agents[a.key]);
            const closeAgents = closeReceivers
                .filter(
                    a => (('department' in a) && a.department !== 'station') &&
                    a.agenda &&
                    (a.agenda[0].options?.reacting === undefined || a.agenda[0].options?.reacting === false));

            const farReceivers = (await redisServices.geoSearch(agent.actual, 15000, agent) as any[]).map((a) => a = services.agents[a.key]);
            const farStationAgents = farReceivers
                .filter(
                    a => (('department' in a) && a.department === 'station') &&
                    a.agenda &&
                    (a.agenda[0].options?.reacting === undefined || a.agenda[0].options?.reacting === false));

            const receiverAgents  = [...closeAgents,...farStationAgents];
            n = effect.damageLevel*10;

            return messageServices.sendDirectMessage(agent, 'Call the police', receiverAgents.slice(0,n), services);

    }
    // messageServices.sendDirectMessage(agent, 'Call the police', receiversAgents.slice(0,n), services);

    return true;
};

export const dispatchServices = {
    sendDefence,
};