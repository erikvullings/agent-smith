import { messageServices, redisServices } from '.';
import { IEnvServices } from '../env-services';
import { IAgent } from '../models';
import { generateSISPolice } from '../utils';
import { planEffects } from './plan-effects';

let defenceSent: boolean = false;
let strategySet: boolean = false;

const sendDefence = async (agent: IAgent, services: IEnvServices) => {
    if(agent.reactedTo === undefined || planEffects[agent.reactedTo] === undefined) {
        return true;
    }

    const effect = planEffects[agent.reactedTo];

    if(effect && !defenceSent && agent.reactedTo === 'Chaos') {
        console.log('sen defence chaos');
        // const newAgent = generateExistingAgent(agent.actual.coord[0], agent.actual.coord[1], 100, id, agent, 'man');
        // a = newAgent.agent;
        // agents.push(a);
        // redisServices.geoAdd('agents', a);
        // services.agents[id] = a;


        console.log('done')
        return true;
    }
    if(effect && !defenceSent){
        const closeReceivers = (await redisServices.geoSearch(agent.actual, 1000, agent) as any[]).map((a) => a = services.agents[a.key]);
        const closeAgents = closeReceivers
            .filter(
                a => (('baseLocation' in a) && a.baseLocation !== 'station') &&
                agent.force === 'blue' &&
                a.agenda &&
                (a.agenda[0].options?.reacting === undefined || a.agenda[0].options?.reacting === false));

        const farReceivers = (await redisServices.geoSearch(agent.actual, 15000, agent) as any[]).map((a) => a = services.agents[a.key]);
        const farStationAgents = farReceivers
            .filter(
                a => (('baseLocation' in a) && a.baseLocation === 'station') &&
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

const strategy = new Map();

const setStrategy = async (agent: IAgent, services: IEnvServices) => {
  const redAgents: IAgent[] = [];
  const blueAgents: IAgent[] = [];

    if(!strategySet){
        for(const a in services.agents){
          if (services.agents.hasOwnProperty(a)) {
            if(services.agents[a].force === 'red'){
              redAgents.push(services.agents[a]);
            }
          }
        }

        for(const a in services.agents){
            if (services.agents.hasOwnProperty(a)) {
              if(services.agents[a].force === 'blue'){
                blueAgents.push(services.agents[a]);
              }
            }
          }

        for(let i=0; i<blueAgents.length;i++){
            blueAgents[i].following = redAgents[i].id;
            blueAgents[i].target = redAgents[i];
            console.log('strategy', blueAgents[i].id, 'targeting',redAgents[i].id)
            strategy.set(blueAgents[i].id,redAgents[i].id);
        }
    }
    console.log('strategy is set');

    strategySet = true;
};

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