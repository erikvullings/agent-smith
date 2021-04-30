import { redisServices } from ".";
import { envServices, IEnvServices } from "../env-services";
import { IAgent, IGroup } from "../models";


const sendMessage = async (sender: IAgent, message: string, radius: string, services: IEnvServices) => {
    var receivers = await redisServices.geoSearch(sender.actual, "100", sender) as Array<any>;
    receivers = receivers.filter(a => {
        return a.key != sender.id;
      });
    
    var receiversAgents: Array<IAgent> = [];
    receiversAgents = receivers.map((a) => a = services.agents[a.key])
  
    if(receiversAgents.length > 0 ) {
        receiversAgents.forEach(rec => {
            if(rec.mailbox) {
                rec.mailbox.push({senderId: sender.id, message: message});
            }
            else {
                rec.mailbox = [{senderId: sender.id, message: message}];
            }
            console.log(rec.id,rec.mailbox)
    });
}
}

const readMailbox = async (agent: IAgent | IGroup, services: IEnvServices) => {
    if(agent.mailbox) {
        console.log(agent.mailbox)
    }
    else{

    }
    
  };
  

  export const messageServices = {
    sendMessage,
    readMailbox
  };