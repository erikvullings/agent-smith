import { IAgent } from "../models";


const sendMessage = async (sender: IAgent, message: string, receivers: Array<IAgent>) => {
    receivers.forEach(rec => {
        if(rec.mailbox) {
            rec.mailbox.push({senderId: sender.id, message: message});
        }
        else {
            rec.mailbox = [{senderId: sender.id, message: message}];
        }
    });
    console.log(receivers[1].mailbox)

  }

  export const messageServices = {
    sendMessage,
  };