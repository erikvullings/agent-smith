import { reaction, redisServices } from ".";
import { IEnvServices } from "../env-services";
import { IAgent, IGroup, IMail } from "../models";
import { randomIntInRange } from "../utils";
import { agendas } from "./agendas";

const sendMessage = async (sender: IAgent, message: string, radius: string, services: IEnvServices) => {
    const receivers = await redisServices.geoSearch(sender.actual, radius, sender) as Array<any>;
    const receiversAgents = (receivers.filter(a => a.key !== sender.id ).map((a) => a = services.agents[a.key])).filter(a => a.agenda && a.agenda[0].name != "Stay at police station" ) as Array<IAgent>;
    if(!sender.sentbox){sender.sentbox = []}

    if(receiversAgents.length > 0 ) {
        receiversAgents.forEach(rec => {
            const sentbox = sender.sentbox.filter((item) => item.mail.message === message && item.receiver == rec);
            if(rec.mailbox && sentbox.length == 0) {
                rec.mailbox.push({sender: sender, location: sender.actual, message: message});
            }
            else if(!rec.mailbox && sentbox.length == 0) {
                rec.mailbox = [{sender: sender, location: sender.actual, message: message}];
            }
    });
  }
  console.log("message sent",{sender: sender, location: sender.actual, message: message} )
  return true;
}

const sendDirectMessage = async (sender: IAgent, message: string, receivers:Array<IAgent>, services: IEnvServices) => {
    if(receivers.length > 0 ) {
        console.log("receivers",receivers)
        console.log("sender", sender.id)
        receivers.forEach(rec => {
            if(rec.mailbox) {
                rec.mailbox.push({sender: sender, location: sender.actual, message: message});
            }
            else {
                rec.mailbox = [{sender: sender, location: sender.actual, message: message}];
            }
    });
  }
  return true;
}


const readMailbox = async (agent: IAgent | IGroup, services: IEnvServices) => {
    const urgentMessages = agent.mailbox.filter(item => (reaction[item.message][agent.force] && reaction[item.message][agent.force].urgency != undefined && reaction[item.message][agent.force].urgency < 2));

    if(urgentMessages.length >0){
            return await reactToMessage(agent, services, urgentMessages);;
        }
        return false;
};

const reactToMessage = async (agent: IAgent | IGroup, services: IEnvServices, urgentMessages: Array<IMail>) => {
    let actionToReact = null as unknown as IMail;
    let itemUrgency = reaction[urgentMessages[0].message][agent.force].urgency;

    if(agent.agenda && agent.agenda[0].options.reacting !=true){
        //not reacting agents where reaction to plan is not undefined

        console.log("not reacting yet")
        if(agent.agenda && agent.agenda[0].options?.priority != undefined && agent.agenda[0].options?.priority < itemUrgency){
            //prio of agenda is smaller, so it is more important
            //stay in agenda
            return true;
        }
        else if(agent.agenda && agent.agenda[0].options?.priority != undefined && agent.agenda[0].options?.priority == itemUrgency){
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
            //if prio is bigger than urgency, pick one from the reactions
            actionToReact = urgentMessages[randomIntInRange(0, urgentMessages.length-1)];
            actionToReact.sender.sentbox.push({receiver: agent,mail: actionToReact})
            return await agendas.addReaction(agent,services, actionToReact);
        }
    }
    else {
        console.log("already reacting");
        //check if urgency is smaller than current reaction, if so pick the new reaction
        if(agent.agenda && agent.agenda[0].options?.priority != undefined && agent.agenda[0].options?.priority > itemUrgency){
            //prio of agenda is bigger
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
    readMailbox
  };