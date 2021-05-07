import { reaction, redisServices } from ".";
import { IEnvServices } from "../env-services";
import { IAgent, IGroup, IMail } from "../models";
import { IDefenseAgent } from "../models/defense-agent";
import { randomIntInRange } from "../utils";
import { agendas } from "./agendas";


const sendMessage = async (sender: IAgent, message: string, radius: string, services: IEnvServices) => {
    const receivers = await redisServices.geoSearch(sender.actual, radius, sender) as Array<any>;
    console.log("receivers before", receivers.length)
    const receiversAgents = (receivers.filter(a => a.key !== sender.id ).map((a) => a = services.agents[a.key])).filter(a => !("department" in a) || a.department != 'station' );
    console.log("receivers after", receiversAgents.length)

    if(receiversAgents.length > 0 ) {
        await send(sender, message, receiversAgents, services);
    }

    return true;
}

const sendDirectMessage = async (sender: IAgent, message: string, receivers:Array<IAgent>, _services: IEnvServices) => {
    if(receivers.length > 0 ) {
        await send(sender, message, receivers, _services);
    }

    return true;
}

const send = async(sender:IAgent, message: string, receivers:Array<IAgent>, _services: IEnvServices) => {
    if(!sender.sentbox){sender.sentbox = []}

    receivers.forEach(rec => {
        const sentbox = sender.sentbox.filter((item) => item.mail.message === message && item.receiver == rec);

        if(rec.mailbox && sentbox.length == 0) {
            rec.mailbox.push({sender: sender, location: sender.actual, message: message});
        }
        else if(!rec.mailbox && sentbox.length == 0) {
            rec.mailbox = [{sender: sender, location: sender.actual, message: message}];
        }
    });
    return true;
}

const readMailbox = async (agent: IAgent | IGroup, services: IEnvServices) => {
    const urgentMessages = agent.mailbox.filter(item => (reaction[item.message][agent.force] && reaction[item.message][agent.force]!.urgency && reaction[item.message][agent.force]!.urgency < 2));

    if(urgentMessages.length >0){
            return await reactToMessage(agent, services, urgentMessages);;
        }
    return false;
};

const reactToMessage = async (agent: IAgent | IGroup, services: IEnvServices, urgentMessages: Array<IMail>) => {
    let actionToReact = null as unknown as IMail;
    const itemUrgency = reaction[urgentMessages[0].message][agent.force]?.urgency;

    if(itemUrgency == undefined){
        return true;
    }
    else if(!agent.agenda || !agent.agenda[0] || !agent.agenda[0].options){
        return true;
    }

    const options = agent.agenda[0].options;
    
    if(options.reacting==undefined|| options.reacting !=true){
        //not reacting agents where reaction to plan is not undefined
        if(options.priority != undefined && options.priority < itemUrgency){
            //prio of agenda is less, so it is more important
            //stay in agenda
            return true;
        }
        else if(options.priority != undefined && options.priority == itemUrgency){
            //if urgency an agenda prio is equal, pick one of them
            const randomInt = randomIntInRange(0, urgentMessages.length);

            if(randomInt == urgentMessages.length){
                //stay in agenda
                return true;
            }
            else {
                //pick one of the reactions
                actionToReact = urgentMessages[randomInt];
                actionToReact.sender.sentbox.push({receiver: agent,mail: actionToReact})
                return await agendas.addReaction(agent,services, actionToReact);
            }
        }
        else{
            //if prio is greater than urgency, pick one from the reactions
            actionToReact = urgentMessages[randomIntInRange(0, urgentMessages.length-1)];
            actionToReact.sender.sentbox.push({receiver: agent,mail: actionToReact})
            return await agendas.addReaction(agent,services, actionToReact);
        }
    }
    else {
        //check if urgency is greater than current reaction, if so pick the new reaction
        if(options.priority != undefined && options.priority > itemUrgency){
            //prio of agenda is greater
            //pick new reaction
            actionToReact = urgentMessages[randomIntInRange(0, urgentMessages.length-1)];
            actionToReact.sender.sentbox.push({receiver: agent,mail: actionToReact})
            return await agendas.addReaction(agent,services, actionToReact);
        }
        else{
            return true;
        }
    }
};

export const messageServices = {
    sendMessage,
    readMailbox,
    sendDirectMessage
};