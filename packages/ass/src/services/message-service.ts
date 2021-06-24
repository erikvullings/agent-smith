import { reaction, redisServices } from '.';
import { IEnvServices } from '../env-services';
import { IAgent, IMail } from '../models';
import { randomIntInRange } from '../utils';
import { agendas } from './agendas';
import { planEffects } from './plan-effects';

/**
 * Send a message to the agents in the radius.
 * The radius for the message (messageRadius) is specified in the planEffects.
 *
 * @param sender : The sender agent
 * @param message : The action of the agent that produces the message
 */

const sendMessage = async (sender: IAgent, message: string, services: IEnvServices) => {
    let radius = 5;
    if (planEffects[message]) {
        radius = planEffects[message].messageRadius;
    }

    const receivers = await redisServices.geoSearch(sender.actual, radius, sender) as any[];
    const receiversRedis = receivers.filter((a) => a.key !== sender.id);
    const receiversAgents = receiversRedis.map((a) => a = services.agents[a.key]).filter(a => (!('baseLocation' in a) || services.locations[a.baseLocation].type !== ('police station' || 'sis base')) && a.status !== 'inactive' && a.reactedTo !== message);

    if (receiversAgents.length > 0) {
        await send(sender, message, receiversAgents, services);
    }

    return true;
}

/**
 * Send a direct message to specific agents.
 * This is generally used to communicate with one specific agent or to communicate with the police
 *
 * @param sender : The sender agent
 * @param message : The message that is being sent
 * @param receivers : The receiver agents for the message
 */

const sendDirectMessage = async (sender: IAgent, message: string, receivers: IAgent[], _services: IEnvServices) => {
    if (receivers.length > 0) {
        await send(sender, message, receivers, _services);
    }

    return true;
}

/**
 * Prepares the message and pushes it to the mailbox of the receivers
 * Adds the message to the sentbox of the sender
 *
 * @param sender : The sender agent
 * @param message : The message that is being sent
 * @param receivers : The receiver agents for the message
 */

const send = async (sender: IAgent, message: string, receivers: IAgent[], _services: IEnvServices) => {
    if (!sender.sentbox) { sender.sentbox = [] }
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

/**
 * Reads the message,
 * If there are urgent messages (if a reaction to the message exists and has a minimal urgency of 2)
 * calls reactToMessage
 *
 */

const readMailbox = async (agent: IAgent, services: IEnvServices, agents: IAgent[]) => {
    const urgentMessages = agent.mailbox.filter(item => (reaction[item.message][agent.force] && reaction[item.message][agent.force]!.urgency && reaction[item.message][agent.force]!.urgency < 2));
    if (urgentMessages.length > 0) {
        return reactToMessage(agent, services, urgentMessages, agents);;
    }
    return false;
};

/**
 * Based on the current agenda item priority and the fact that if the agent is already reacting
 * Calls the function react
 *
 */

const reactToMessage = async (agent: IAgent, services: IEnvServices, urgentMessages: IMail[], agents: IAgent[]) => {
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
        // check if urgency is less than item urgency, if so the agenda is more important
        if (options.priority !== undefined && options.priority < itemUrgency) {
            // stay in agenda
            return true;
        }
        if (options.priority !== undefined && options.priority === itemUrgency) {
            // if urgency an agenda prio is equal, pick one of them
            const random = randomIntInRange(0, urgentMessages.length);

            if (random === urgentMessages.length) {
                // stay in agenda
                return true;
            }

            return react(agent, services, urgentMessages, random, agents)
        }

        // if prio is greater than urgency, pick one from the reactions
        const randomInt = randomIntInRange(0, urgentMessages.length - 1);
        return react(agent, services, urgentMessages, randomInt, agents)
    }

    // check if urgency is greater than current reaction, if so pick the new reaction
    if (options.priority !== undefined && options.priority > itemUrgency) {
        const randomInt = randomIntInRange(0, urgentMessages.length - 1);
        return react(agent, services, urgentMessages, randomInt, agents)
    }

    return true;


};

/**
 * Cleanes mailbox and calls the function to add the reaction to the agent agenda
 *
 */

const react = async (agent: IAgent, services: IEnvServices, urgentMessages: IMail[], itemIndex: number, agents: IAgent[]) => {
    let actionToReact = null as unknown as IMail;
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