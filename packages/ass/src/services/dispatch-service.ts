import { messageServices, redisServices } from '.';
import { IEnvServices } from '../env-services';
import { IAgent } from '../models';
import { planEffects } from './plan-effects';

let defenceSent: boolean = false;
let strategySet: boolean = false;
const strategy = new Map();

/**
 * Sends police agent that are close to the location
 * and if necessary police agents that are at the police station
 */

const sendDefence = async (agent: IAgent, services: IEnvServices, eventType?: string) => {
    if(eventType && eventType === 'terrorism'){
      const sisAgents: IAgent[] = [];
      for (const a in services.agents) {
        if (services.agents.hasOwnProperty(a)) {
          if (services.agents[a].force === 'blue' && services.agents[a].type === 'group') {
            sisAgents.push(services.agents[a]);
          }
        }
      }

      messageServices.sendDirectMessage(agent, 'Chaos', [...sisAgents], services);
      return true;
    }

    if(agent.reactedTo === undefined || planEffects[agent.reactedTo] === undefined) {
        return true;
    }

    const effect = planEffects[agent.reactedTo];

    if(effect && !defenceSent){
        const closeReceivers = (await redisServices.geoSearch(agent.actual, 1000, agent) as any[]).map((a) => a = services.agents[a.key]);
        const closeAgents = closeReceivers
            .filter(
                a => (('baseLocation' in a) && services.locations[a.baseLocation].type !== ('police station' || 'sis base')) &&
                agent.force === 'blue' &&
                a.agenda &&
                (a.agenda[0].options?.reacting === undefined || a.agenda[0].options?.reacting === false));

        const farReceivers = (await redisServices.geoSearch(agent.actual, 15000, agent) as any[]).map((a) => a = services.agents[a.key]);
        const farStationAgents = farReceivers
            .filter(
                a => (('baseLocation' in a) && services.locations[a.baseLocation].type === 'police station') &&
                agent.force === 'blue' &&
                a.agenda &&
                (a.agenda[0].options?.reacting === undefined || a.agenda[0].options?.reacting === false));

        const receiverAgents  = [...closeAgents,...farStationAgents];
        const policeAmount = effect.damageLevel;

        defenceSent = true;
        return messageServices.sendDirectMessage(agent, 'Call the police', receiverAgents.slice(0,policeAmount), services);

    }
    return true;
};


/**
 * Sets a strategy for the SIS(Special Intervention Service)
 */

const setStrategy = async (services: IEnvServices) => {
  const redAgents: IAgent[] = [];
  const blueAgents: IAgent[] = [];

    if(!strategySet){
        for(const a in services.agents){
          if (services.agents.hasOwnProperty(a)) {
            if(services.agents[a].force === 'red' && services.agents[a].type !== ('group' || 'car')){
              redAgents.push(services.agents[a]);
            }
          }
        }

        for(const a in services.agents){
            if (services.agents.hasOwnProperty(a)) {
              if(services.agents[a].force === 'blue' && services.agents[a].type !== ('group' || 'car')){
                blueAgents.push(services.agents[a]);
              }
            }
          }

        for(let i=0; i<blueAgents.length;i++){
            blueAgents[i].following = redAgents[i%redAgents.length].id;
            blueAgents[i].target = redAgents[i%redAgents.length];
            // console.log('strategy', blueAgents[i].id, 'targeting',redAgents[i%redAgents.length].id)
            strategy.set(blueAgents[i].id,redAgents[i%redAgents.length].id);
        }
    }

    strategySet = true;
};

/**
 * Police agent picks a new red target
 */

const pickNewTarget = async (agent: IAgent, services: IEnvServices) => {
  const redAgents = (await redisServices.geoSearch(agent.actual, 100000, agent) as any[]).map((a) => a = services.agents[a.key]).filter(a => a.force === 'red' && a.health && a.health >0 && a.type !== 'group');

  return redAgents[0];
};



export const dispatchServices = {
    pickNewTarget,
    strategy,
    setStrategy,
    sendDefence,
};