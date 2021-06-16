import { planEffects, redisServices } from '.';
import { IEnvServices } from '../env-services';
import { IAgent, IEquipment, IMail } from '../models';
import { agentToEntityItem, randomIntInRange, randomItem, randomPlaceNearby } from '../utils';

const damageAgent = async (sender: IAgent, receivers: IAgent[], _services: IEnvServices) => {
    const equipment = await pickEquipment(sender);

    if (receivers.length > 0 && equipment !== null) {
        receivers.filter((a) => a.health && a.health > 0 && a.attire && (a.attire === 'bulletproof vest' || a.attire === 'bulletproof bomb vest')).map((a) => (a.health! -= equipment.damageLevel * randomIntInRange(0, 10)));
        receivers.filter((a) => a.health && a.health > 0 && !a.attire).map((a) => (a.health! -= equipment.damageLevel * randomIntInRange(10, 20)))

        receivers.filter(a => !a.health || a.health < 0).map(a => a.health = 0);
    }
    else if (equipment === null) {
        receivers.filter((a) => a.health && a.health > 0 && a.visibility !== 0).map((a) => (a.health! -= randomIntInRange(0, 10)));
    }

    const deadAgents = receivers.filter((a) => a.health && a.health <= 0)
    if (deadAgents.length > 0) {
        deadAgents.map((a) => (a.agenda = []) && (a.route = []) && (a.steps = []) && (a.status = 'inactive'))
    }

    if (equipment) {
        equipment.limit -= 1;
        if (equipment.limit < 1 && sender.equipment) {
            const index = sender.equipment.indexOf(equipment, 0);
            if (index > -1) {
                sender.equipment.splice(index, 1);
            }
        }
    }

    return true;
}

const damageRandomAgent = async (sender: IAgent, _services: IEnvServices) => {
    const equipment = randomItem(sender.equipment);
    let receivers: IAgent[] = [];
    if (equipment && equipment.type === 'firearm') {
        const inRange = await redisServices.geoSearch(sender.actual, 1000, sender);
        const agentsInRange = inRange.map((a: any) => a = _services.agents[a.key]).filter((a: IAgent) => !(a.force === 'red'));
        receivers = [randomItem(agentsInRange)];
    }
    else if (equipment && equipment.type === 'handgrenade') {
        const center = randomPlaceNearby(sender, 40, 'any', 20);
        const deathRange = await redisServices.geoSearch(center, 5);
        const agentsInDeathRange = deathRange.map((a: any) => a = _services.agents[a.key]);
        agentsInDeathRange.map((a: IAgent) => a.health = 0)
        const damageRange = await redisServices.geoSearch(center, 15);
        receivers = damageRange.map((a: any) => a = _services.agents[a.key]);
    }
    if (receivers && equipment && equipment.limit > 0) {
        if (receivers.length > 0 && equipment !== null) {
            receivers.filter((a) => a.health && a.health > 0 && a.attire && (a.attire === 'bulletproof vest' || a.attire === 'bulletproof bomb vest')).map((a) => (a.health! -= equipment.damageLevel * randomIntInRange(0, 10)));
            receivers.filter((a) => a.health && a.health > 0 && !a.attire).map((a) => (a.health! -= equipment.damageLevel * randomIntInRange(10, 20)))

            receivers.filter(a => !a.health || a.health < 0).map(a => a.health = 0);
        }
        else if (equipment === null) {
            receivers.filter((a) => a.health && a.health > 0).map((a) => (a.health! -= randomIntInRange(0, 10)));
        }

        const deadAgents = receivers.filter((a) => a.health && a.health <= 0)
        if (deadAgents.length > 0) {
            deadAgents.map((a) => (a.agenda = []) && (a.route = []) && (a.steps = []) && (a.status = 'inactive'))
        }
        equipment.limit -= 1;
        if (equipment.limit < 1 && sender.equipment) {
            const index = sender.equipment.indexOf(equipment, 0);
            if (index > -1) {
                sender.equipment.splice(index, 1);
            }
        }

    }

    return true;
}

const pickEquipment = async (agent: IAgent) => {
    let sortedEquipments = [];

    if(agent.force === 'blue' && agent.reactedTo && planEffects[agent.reactedTo] && agent.equipment && agent.equipment.length >0){
        const {severity} = planEffects[agent.reactedTo];
        if(severity>0){
            sortedEquipments = agent.equipment.filter(((e: { damageLevel: number; }) => e.damageLevel && e.damageLevel === severity-1 || e.damageLevel === severity)).sort((a: { damageLevel: number; },b: { damageLevel: number; }) => b.damageLevel - a.damageLevel);
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
    damageRandomAgent,
    pickEquipment,
};


