import { redisServices } from ".";
import { envServices, IEnvServices } from "../env-services";
import { IAgent, IGroup } from "../models";
import { agendas } from "./agendas";


const sendMessage = async (sender: IAgent, message: string, radius: string, services: IEnvServices, urgency: 1 | 2 | 3 | 4 | 5) => {
    var receivers = await redisServices.geoSearch(sender.actual, radius, sender) as Array<any>;
    
    var receiversAgents: Array<IAgent> = [];
    receiversAgents = receivers.filter(a => a.key != sender.id).map((a) => a = services.agents[a.key])
    if(receiversAgents.length > 0 ) {
        console.log("receivers",receiversAgents)
        console.log("sender", sender.id)
        receiversAgents.forEach(rec => {
            if(rec.mailbox) {
                rec.mailbox.push({senderId: sender.id, message: message, urgency: 1});
            }
            else {
                rec.mailbox = [{senderId: sender.id, message: message, urgency: 1}];
            }
            //console.log(rec.id,rec.mailbox)
    });
}
}

const readMailbox = async (agent: IAgent | IGroup, services: IEnvServices) => {
    if(agent.mailbox) {
        //console.log("before filter",agent.mailbox);
        //var test = agent.mailbox[0];
        agent.mailbox.forEach(message => {
            // if(message.urgency < 3 && message.urgency < test.urgency){
            //     test = message;
            // }
            if(message.message === "drop object") {
                console.log("droped object runnnn")
                agent.mailbox = [];
                agendas.addReaction(agent,services)
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