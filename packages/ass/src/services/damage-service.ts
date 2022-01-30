import { planEffects, redisServices, messageServices } from '.';
import { IEnvServices } from '../env-services';
import { IAgent } from '../models';
import { generateExistingAgent, randomIntInRange, randomItem, randomPlaceNearby } from '../utils';

/**
 * Picks the equipment and
 * Gives the receivers damage, based on the damageLevel of the equipment and the attire of the receiver
 *
 * @param {IAgent} sender : The sender of the message
 * @param {IAgent[]} receivers : The receivers of the message
 * @param {IEnvServices} _services
 */
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

/**
 * @param {IAgent} sender : The sender of the message
 * @param {IEnvServices} services
 * Damages random agent or agents nearby with a random item agent.equipment
 */

const damageRandomAgent = async (sender: IAgent, services: IEnvServices, agents: IAgent[]) => {
    const equipment = randomItem(sender.equipment);
    let receivers: IAgent[] = [];
    if (equipment && equipment.type === 'handgrenade' && equipment.limit > 0) {
        const center = randomPlaceNearby(sender, 100, 'any', 20);

        const { agent: grenade } = generateExistingAgent(center.coord[0], center.coord[1], 10, undefined, undefined, 'grenade');
        grenade.actual = center;
        grenade.force = sender.force;

        agents.push(grenade);
        services.agents[grenade.id] = grenade;
        await redisServices.geoAdd('agents', grenade);

        grenade.steps = [{ name: 'explode', options: {} }];
        messageServices.sendMessage(grenade, 'Drop bomb', services);

        equipment.limit -= 1;
        if (equipment.limit < 1 && sender.equipment) {
            const index = sender.equipment.indexOf(equipment, 0);
            if (index > -1) {
                sender.equipment.splice(index, 1);
            }
        }

    } else if (equipment && equipment.type === 'firearm') {
        const inRange = await redisServices.geoSearch(sender.actual, 200, sender);
        const agentsInRange = inRange.map((a: any) => a = services.agents[a.key]).filter((a: IAgent) => !(a.force === 'red'));
        if (agentsInRange && agentsInRange.length > 0) {
            receivers = [randomItem(agentsInRange)];

            if (receivers && receivers.length > 0 && equipment && equipment.limit > 0) {
                if (equipment !== null) {
                    receivers.filter((a) => a.health && a.health > 0 && a.attire && (a.attire === 'bulletproof vest' || a.attire === 'bulletproof bomb vest')).map((a) => (a.health! -= equipment.damageLevel * randomIntInRange(0, 10)));
                    receivers.filter((a) => a.health && a.health > 0 && !a.attire).map((a) => (a.health! -= equipment.damageLevel * randomIntInRange(10, 20)))
                    receivers.filter(a => !a.health || a.health < 0).map(a => a.health = 0);
                }
                else {
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
        }
    }

    return true;
}

/**
 * Picks the equipment of the blue agent based on the severity of the action
 *
 * @param {IAgent} agent
 */
const pickEquipment = async (agent: IAgent) => {
    let sortedEquipments = [];

    if (agent.force === 'blue' && agent.reactedTo && planEffects[agent.reactedTo] && agent.equipment && agent.equipment.length > 0) {
        const { severity } = planEffects[agent.reactedTo];
        if (severity > 2) {
            sortedEquipments = agent.equipment.filter(((e: { damageLevel: number; }) => e.damageLevel && e.damageLevel === severity - 1 || e.damageLevel === severity)).sort((a: { damageLevel: number; }, b: { damageLevel: number; }) => b.damageLevel - a.damageLevel);
            return sortedEquipments[randomIntInRange(0, sortedEquipments.length - 1)];
        }
        return null;
    }
    return null;
}

export const damageServices = {
    damageAgent,
    damageRandomAgent,
    pickEquipment,
};


