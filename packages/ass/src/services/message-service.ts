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
        var actionToReact = null as unknown as IMail;
        var importantMessages: Array<IMail> = [];
        agent.mailbox.forEach(item => {
            let itemReaction = reaction[item.message];
            let itemUrgency = itemReaction[agent.force].urgency
             if(itemReaction && itemUrgency < 3){
                
                if(actionToReact == null){
                    actionToReact = item;
                }
                else if(itemUrgency < reaction[actionToReact.message][agent.force].urgency){
                    agent.mailbox = [];
                    actionToReact = item;
                    //agendas.addReaction(agent,services, actionToReact)    
                }
                else if(reaction[item.message][agent.force].urgency == reaction[actionToReact.message][agent.force].urgency){
                    importantMessages.push(item);
                }
            } 
        });
    
        if(importantMessages.length >0){
            let itemUrgency = reaction[importantMessages[0].message][agent.force].urgency;
            if(agent.agenda && agent.agenda[0].options?.priority != undefined && agent.agenda[0].options?.priority > itemUrgency){
                agent.mailbox = [];
                actionToReact = importantMessages[randomIntInRange(0,importantMessages.length-1)];
                agendas.addReaction(agent,services, actionToReact)    
            }
            return true;
        }
        else if(actionToReact != null){
            let itemUrgency = reaction[actionToReact.message][agent.force].urgency;
            if(agent.agenda && agent.agenda[0].options?.priority){
                if(agent.agenda[0].options?.priority > itemUrgency) {
                    agent.mailbox = [];
                    agendas.addReaction(agent,services, actionToReact)            
                }
                return true;
            }
            else{
                agent.mailbox = [];
                agendas.addReaction(agent,services, actionToReact)            
            }
            return true;
        }
    return true;
  };
  

  export const messageServices = {
    sendMessage,
    readMailbox
  };