import { reaction, redisServices } from '.';
import { IEnvServices } from '../env-services';
import { IAgent, IDefenseAgent, IEquipment, IMail } from '../models';
import { randomIntInRange } from '../utils';
import { agendas } from './agendas';
import { planEffects } from './plan-effects';


const sendMessage = async (sender: IAgent, message: string, services: IEnvServices) => {
    let radius = 10000;
    if (planEffects[message]) {
        radius = planEffects[message].messageRadius;
        console.log(message, radius)
    }

    const receivers = await redisServices.geoSearch(sender.actual, radius, sender) as any[];
    console.log('receivers before', receivers.length)
    const receiversAgents = (receivers.filter((a) => a.key !== sender.id).map((a) => a = services.agents[a.key])).filter(a => (!('department' in a) || a.department !== 'station') && a.status !== 'inactive');
    console.log('receivers after', receiversAgents.length)

    if (receiversAgents.length > 0) {
        await send(sender, message, receiversAgents, services);
    }

    return true;
}

const sendDirectMessage = async (sender: IAgent, message: string, receivers: IAgent[], _services: IEnvServices) => {
    if (receivers.length > 0) {
        await send(sender, message, receivers, _services);
    }

    return true;
}

const sendDamage = async (sender: IAgent | IDefenseAgent, agentAction: string, receivers: IAgent[], _services: IEnvServices) => {
    // _services.agents["biker"].health = 100;

    const damage = await pickEquipment(sender, agentAction)

    if (receivers.length > 0) {
        receivers.filter((a) => a.health).map((a) => (a.health! -= damage));

        const deadAgents = receivers.filter((a) => a.health && a.health <= 0)
        if (deadAgents.length > 0) {
            deadAgents.map((a) => (a.agenda = []) && (a.route = []) && (a.steps = []) && (a.status = 'inactive'))
        }
    }
    return true;
}

const pickEquipment = async (agent: IAgent | IDefenseAgent, agentAction: string) => {
    if (agent.force === 'blue' && agent.reactedTo && planEffects[agent.reactedTo] && agent.equipment) {
        const { severity } = planEffects[agent.reactedTo];
        // switch(severity){
        //     case 1:
        // }
    }
    else if (agent.force === 'red') {
        return planEffects[agentAction].damageLevel
    }
}

const send = async (sender: IAgent, message: string, receivers: IAgent[], _services: IEnvServices) => {
    if (!sender.sentbox) { sender.sentbox = [] }
    receivers.forEach(rec => {
        const sentbox = sender.sentbox.filter((item) => item.mail.message === message && item.receiver === rec);

        if (rec.mailbox && sentbox.length === 0) {
            rec.mailbox.push({ sender, location: sender.actual, message });
        }
        else if (!rec.mailbox && sentbox.length === 0) {
            rec.mailbox = [{ sender, location: sender.actual, message }];
        }

        if (planEffects[message].panicLevel && rec.force === 'white') {
            const panic = planEffects[message].panicLevel;
            if (rec.panicLevel) {
                rec.panicLevel += panic;
            } else {
                rec.panicLevel = panic;
            }
        }
    });
    return true;
}

const readMailbox = async (agent: IAgent, services: IEnvServices) => {
    const urgentMessages = agent.mailbox.filter(item => (reaction[item.message][agent.force] && reaction[item.message][agent.force]!.urgency && reaction[item.message][agent.force]!.urgency < 3));
    if (urgentMessages.length > 0) {
        return reactToMessage(agent, services, urgentMessages);;
    }
    return false;
};

const reactToMessage = async (agent: IAgent, services: IEnvServices, urgentMessages: IMail[]) => {
    // const actionToReact = null as unknown as IMail;
    const itemReaction = reaction[urgentMessages[0].message][agent.force]?.plans[0];
    const itemUrgency = reaction[urgentMessages[0].message][agent.force]?.urgency;
    console.log('in here')
    if (itemUrgency === undefined || itemReaction === undefined) {
        return true;
    }
    if (!agent.agenda || !agent.agenda[0] || !agent.agenda[0].options) {
        return true;
    }

    const { options } = agent.agenda[0];

    if (options.reacting === undefined || options.reacting !== true) {
        // not reacting agents where reaction to plan is not undefined
        if (options.priority !== undefined && options.priority < itemUrgency) {
            // prio of agenda is less, so it is more important
            // stay in agenda
            return true;
        }
        if (options.priority !== undefined && options.priority === itemUrgency) {
            // if urgency an agenda prio is equal, pick one of them
            const randomInt = randomIntInRange(0, urgentMessages.length);

            if (randomInt === urgentMessages.length) {
                // stay in agenda
                return true;
            }

            // if(itemReaction[0].name === "Call the police"){

            // }
            // pick one of the reactions
            // actionToReact = urgentMessages[randomInt];
            // actionToReact.sender.sentbox.push({receiver: agent,mail: actionToReact})
            // return await agendas.addReaction(agent,services, actionToReact);
            return react(agent, services, urgentMessages, randomInt)

        }

        // if prio is greater than urgency, pick one from the reactions
        const randomInt = randomIntInRange(0, urgentMessages.length - 1);
        return react(agent, services, urgentMessages, randomInt)


    }

    // check if urgency is greater than current reaction, if so pick the new reaction
    if (options.priority !== undefined && options.priority > itemUrgency) {
        // prio of agenda is greater
        // pick new reaction
        const randomInt = randomIntInRange(0, urgentMessages.length - 1);
        return react(agent, services, urgentMessages, randomInt)
    }

    return true;


};

const react = async (agent: IAgent, services: IEnvServices, urgentMessages: IMail[], itemIndex: number) => {
    let actionToReact = null as unknown as IMail;
    // const itemUrgency = reaction[urgentMessages[0].message][agent.force]?.urgency;

    actionToReact = urgentMessages[itemIndex];
    actionToReact.sender.sentbox.push({ receiver: agent, mail: actionToReact })
    return agendas.addReaction(agent, services, actionToReact);
}


export const messageServices = {
    sendMessage,
    readMailbox,
    sendDirectMessage,
    sendDamage,
};