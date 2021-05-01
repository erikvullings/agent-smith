import { reaction, redisServices } from ".";
import { envServices, IEnvServices } from "../env-services";
import { IAgent, IGroup } from "../models";
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
    console.log("sender mailbox",sender.mailbox)
}
}

const readMailbox = async (agent: IAgent | IGroup, services: IEnvServices) => {
    if(agent.mailbox && agent.mailbox.length > 0) {
        //console.log("before filter",agent.mailbox);
        var actionToReact = null;

        agent.mailbox.forEach(message => {
            console.log("reaction message read", reaction[message.message])

             if(reaction[message.message] && reaction[message.message][agent.force].urgency < 2){
                actionToReact = message;
                console.log("action to react", actionToReact);
                //if(message.message === "drop object") {
                

                if(reaction[message.message][agent.force].urgency <= reaction[actionToReact.message][agent.force].urgency)
                console.log("droped object runnnn")
                agent.mailbox = [];
                agendas.addReaction(agent,services, actionToReact)
            }
        });
        //console.log("important message", test)
    }
    else{

    }
    
  };
  

  export const messageServices = {
    sendMessage,
    readMailbox
  };