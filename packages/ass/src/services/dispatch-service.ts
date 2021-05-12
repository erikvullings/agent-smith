import { messageServices, redisServices } from '.';
import { IEnvServices } from '../env-services';
import { IAgent, IGroup } from '../models';
import { planEffects } from './plan-effects';

const sendDefence = async (agent: IAgent | IGroup, services: IEnvServices) => {
    console.log('hereee')
    let n = 0;

    if(agent.reactedTo == undefined || planEffects[agent.reactedTo] == undefined) {
        agent.reactedTo = 'drop object'; // To test function
    }

    const {messageRadius} = planEffects[agent.reactedTo];

    if(planEffects[agent.reactedTo]) {
        console.log('reacted to',agent.reactedTo)
        console.log('damage level',planEffects[agent.reactedTo].damageLevel)
        if(planEffects[agent.reactedTo].damageLevel >= 0.7){
            n = 3;
        }
        else{
            n = 1;
        }
    }

    const receivers = await redisServices.geoSearch(agent.actual, messageRadius, agent) as any[];
    const receiversAgents = (receivers.map((a) => a = services.agents[a.key])).filter(a => ('department' in a) && a.department == 'station' && a.agenda && (a.agenda[0].options?.reacting == undefined || a.agenda[0].options?.reacting == false));
    // console.log("receivers", receiversAgents.slice(0,n))

    return await messageServices.sendDirectMessage(agent, 'Call the police', receiversAgents.slice(0,n), services);;
};

export const dispatchServices = {
    sendDefence,
};