import { planEffects } from '.';
import { IEnvServices } from '../env-services';
import { IAgent, IEquipment, IMail } from '../models';
import { randomIntInRange } from '../utils';

const damageAgent = async (sender: IAgent, receivers:IAgent[], _services: IEnvServices) => {
    const equipment = await pickEquipment(sender);

    if(receivers.length > 0 && equipment !== null) {
        receivers.filter((a) => a.health && a.attire && a.attire === 'bulletproof vest').map((a) => (a.health! -= equipment.damageLevel*randomIntInRange(0,10)));
        receivers.filter((a) => a.health && !a.attire).map((a) => (a.health! -= equipment.damageLevel*20));

    }
    else if(equipment === null){
        receivers.filter((a) => a.health).map((a) => (a.health! -= randomIntInRange(0,10)));
    }

    const deadAgents = receivers.filter((a) => a.health && a.health<=0)
    if(deadAgents.length>0){
        deadAgents.map((a) => (a.agenda = []) && (a.route = []) && (a.steps = []) && (a.status = 'inactive'))
    }

    return true;
}

const pickEquipment = async (agent: IAgent) => {
    let sortedEquipments = [];
    if(agent.force === 'blue' && agent.reactedTo && planEffects[agent.reactedTo] && agent.equipment && agent.equipment.length >0){
        const {severity} = planEffects[agent.reactedTo];
        if(severity>0){
            sortedEquipments = agent.equipment.filter(a => a.damageLevel === severity-1 || a.damageLevel === severity).sort((a,b) => b.damageLevel - a.damageLevel);
            return sortedEquipments[randomIntInRange(0,sortedEquipments.length-1)];
        }

            return null;

    }
    // else if(agent.force === 'red'){
    //     //add red later
    //     return false;
    // }
    return null;
}



export const damageServices = {
    damageAgent,
};