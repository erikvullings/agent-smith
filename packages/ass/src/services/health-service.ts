import { IEnvServices } from '../env-services';
import { IAgent, IDefenseAgent, IEquipment, IGroup, IMail } from '../models';
import { randomIntInRange } from '../utils';

const damageAgent = async (sender: IAgent | IDefenseAgent, agentAction: string, receivers:IAgent[], equipment: IEquipment, _services: IEnvServices) => {

    //const damage = await pickEquipment(sender,agentAction)

    if(receivers.length > 0) {
        receivers.filter((a) => a.health && a.attire && a.attire === 'bulletproof vest').map((a) => (a.health! -= equipment.damageLevel*randomIntInRange(0,10)));
        receivers.filter((a) => a.health && !a.attire).map((a) => (a.health! -= equipment.damageLevel*20));

        const deadAgents = receivers.filter((a) => a.health && a.health<=0)
        if(deadAgents.length>0){
            deadAgents.map((a) => (a.agenda = []) && (a.route = []) && (a.steps = []) && (a.status = 'inactive'))
        }
    }

     console.log('health',_services.agents.red2.health)
    return true;
}

// const pickEquipment = async (agent: IAgent | IDefenseAgent, agentAction: string) => {
//     if(agent.force === 'blue' && agent.reactedTo && planEffects[agent.reactedTo] && agent.equipment){
//         const severity = planEffects[agent.reactedTo].severity;
//         // switch(severity){
//         //     case 1: 
//         // }
//     }
//     else if(agent.force === 'red'){
//         return planEffects[agentAction].damageLevel
//     }    
// }



export const messageServices = {
    damageAgent,
};