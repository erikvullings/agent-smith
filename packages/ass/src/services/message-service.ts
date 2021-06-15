import { deflateSync } from 'zlib';
import { reaction, redisServices } from '.';
import { IEnvServices } from '../env-services';
import { IAgent, IEquipment, IMail } from '../models';
import { randomIntInRange } from '../utils';
import { agendas } from './agendas';
import { planEffects } from './plan-effects';


const sendMessage = async (sender: IAgent, message: string, services: IEnvServices) => {
    let radius = 10000;
    if (planEffects[message]) {
        radius = planEffects[message].messageRadius;
    }
    console.log('radius', radius)
    const receivers = await redisServices.geoSearch(sender.actual, radius, sender) as any[];
    const receiversAgents = (receivers.filter((a) => a.key !== sender.id).map((a) => a = services.agents[a.key])).filter(a => (!('baseLocation' in a) || a.baseLocation !== 'station') && a.status !== 'inactive');

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

const send = async (sender: IAgent, message: string, receivers: IAgent[], _services: IEnvServices) => {
    if (!sender.sentbox) { sender.sentbox = [] }
    // console.log(sender.id, sender.sentbox)
    receivers.forEach(rec => {
        const sentbox = sender.sentbox.filter((item) => item.mail.message === message && item.receiver === rec);

        if (rec.mailbox && sentbox.length === 0) {
            if (planEffects[message] && planEffects[message].runDistance) {
                rec.mailbox.push({ sender, location: sender.actual, message, runDistance: planEffects[message].runDistance });
            } else {
                rec.mailbox.push({ sender, location: sender.actual, message });
            }
        }
        else if (!rec.mailbox && sentbox.length === 0) {
            if (planEffects[message] && planEffects[message].runDistance) {
                rec.mailbox = [{ sender, location: sender.actual, message, runDistance: planEffects[message].runDistance }];
            } else {
                rec.mailbox = [{ sender, location: sender.actual, message }];
            }
        }

        // add panic to agent, if the agent does not already have panic from the same message
        if (planEffects[message] && planEffects[message].panicLevel && rec.force === 'white') {
            const panic = planEffects[message].panicLevel;
            if (rec.panic) {
                if (rec.panic.panicCause && rec.panic.panicCause.indexOf(message) < 0) {
                    rec.panic.panicLevel += panic;
                    rec.panic.panicCause.push(message);
                }
                else if (!rec.panic.panicCause) {
                    rec.panic.panicLevel += panic;
                    rec.panic.panicCause = [message]
                }
            } else {
                rec.panic = { panicLevel: panic, panicCause: [message] };
            }
        }

        // add delay to agent, if the agent does not already have panic from the same message
        if (planEffects[message] && planEffects[message].delayLevel) {
            const delay = planEffects[message].delayLevel;
            if (rec.delay) {
                if (planEffects[message].delayCause) {
                    if (rec.delay.delayCause && rec.delay.delayCause.indexOf(planEffects[message].delayCause!) < 0) {
                        rec.delay.delayLevel += delay
                        rec.delay.delayCause.push(planEffects[message].delayCause!)
                    }
                    else if (!rec.delay.delayCause) {
                        rec.delay.delayLevel += delay
                        rec.delay.delayCause = [planEffects[message].delayCause!]
                    }
                }
            } else {
                rec.delay = { delayLevel: delay, delayCause: planEffects[message].delayCause ? [planEffects[message].delayCause!] : undefined };
            }
        }
    });
    return true;
}

const readMailbox = async (agent: IAgent, services: IEnvServices, agents: IAgent[]) => {
    const urgentMessages = agent.mailbox.filter(item => (reaction[item.message][agent.force] && reaction[item.message][agent.force]!.urgency && reaction[item.message][agent.force]!.urgency < 3));
    if (urgentMessages.length > 0) {
        return reactToMessage(agent, services, urgentMessages, agents);;
    }
    return false;
};

const reactToMessage = async (agent: IAgent, services: IEnvServices, urgentMessages: IMail[], agents: IAgent[]) => {
    // const actionToReact = null as unknown as IMail;
    const itemReaction = reaction[urgentMessages[0].message][agent.force]?.plans[0];
    const itemUrgency = reaction[urgentMessages[0].message][agent.force]?.urgency;

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
            const rndInt = randomIntInRange(0, urgentMessages.length);

            if (rndInt === urgentMessages.length) {
                // stay in agenda
                return true;
            }

            // if(itemReaction[0].name === "Call the police"){

            // }
            // pick one of the reactions
            // actionToReact = urgentMessages[randomInt];
            // actionToReact.sender.sentbox.push({receiver: agent,mail: actionToReact})
            // return await agendas.addReaction(agent,services, actionToReact);
            return react(agent, services, urgentMessages, rndInt, agents)

        }

        // if prio is greater than urgency, pick one from the reactions
        const randomInt = randomIntInRange(0, urgentMessages.length - 1);
        return react(agent, services, urgentMessages, randomInt, agents)


    }

    // check if urgency is greater than current reaction, if so pick the new reaction
    if (options.priority !== undefined && options.priority > itemUrgency) {
        // prio of agenda is greater
        // pick new reaction
        const randomInt = randomIntInRange(0, urgentMessages.length - 1);
        return react(agent, services, urgentMessages, randomInt, agents)
    }

    return true;


};

const react = async (agent: IAgent, services: IEnvServices, urgentMessages: IMail[], itemIndex: number, agents: IAgent[]) => {
    let actionToReact = null as unknown as IMail;
    // const itemUrgency = reaction[urgentMessages[0].message][agent.force]?.urgency;

    actionToReact = urgentMessages[itemIndex];
    actionToReact.sender.sentbox.push({ receiver: agent, mail: actionToReact })
    const cleanedMailbox = agent.mailbox.filter(mail => mail.message !== actionToReact.message && mail.sender !== actionToReact.sender)
    agent.mailbox = [...cleanedMailbox];
    return agendas.addReaction(agent, services, actionToReact, agents);
};


export const messageServices = {
    sendMessage,
    readMailbox,
    sendDirectMessage,
};