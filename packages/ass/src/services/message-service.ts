import { reaction, redisServices } from ".";
import { envServices, IEnvServices } from "../env-services";
import { IAgent, IGroup, IMail } from "../models";
import { randomIntInRange } from "../utils";
import { agendas } from "./agendas";


const sendMessage = async (sender: IAgent, message: string, radius: string, services: IEnvServices) => {
    var receivers = await redisServices.geoSearch(sender.actual, radius, sender) as Array<any>;
    
    var receiversAgents: Array<IAgent> = [];
    receiversAgents = receivers.filter(a => a.key != sender.id).map((a) => a = services.agents[a.key])
    if(receiversAgents.length > 0 ) {
        console.log("receivers",receiversAgents)
        console.log("sender", sender.id)
        receiversAgents.forEach(rec => {
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
        var urgentMessages: Array<IMail> = [];
        agent.mailbox.forEach(item => {
            let itemReaction = reaction[item.message];
            let itemUrgency = itemReaction[agent.force].urgency
            if(itemReaction && itemUrgency < 3){
                urgentMessages.push(item);
                };
            }); 
        if(urgentMessages.length >0){
                reactToMessage(agent, services, urgentMessages);
            }
    };
    

  const reactToMessage = async (agent: IAgent | IGroup, services: IEnvServices, urgentMessages: Array<IMail>) => {
    var actionToReact = null as unknown as IMail;
    let itemUrgency = reaction[urgentMessages[0].message][agent.force].urgency;
    if(agent.agenda && agent.agenda[0].options?.priority != undefined && agent.agenda[0].options?.priority < itemUrgency){
        return true;
    }
    else{
        agent.mailbox = [];
        actionToReact = urgentMessages[randomIntInRange(0,urgentMessages.length-1)];
        agendas.addReaction(agent,services, actionToReact);
        return true;
    }
};


  export const messageServices = {
    sendMessage,
    readMailbox
  };