import { ActivityList, IAgent } from '../models';
import { IGroup } from '../models';
import { simTime, hours, randomInRange, randomIntInRange, minutes} from '../utils';
import { IEnvServices, updateAgent } from '../env-services';
import * as simConfig from "../sim_config.json";
import { reactions } from './reactions';
import { time } from 'node:console';

function getAgenda(agent: IAgent | IGroup, _services: IEnvServices) {
  if (typeof agent._day === 'undefined') {
    agent._day = 0;
  } else {
    agent._day++;
  }
  const { _day: day } = agent;

  const activities = {
    'work': () => [
      [{ name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 } },
      { name: 'Work', options: { duration: hours(3, 5), priority: 1 } },
      { name: 'Have lunch', options: { priority: 2 } },
      { name: 'Work', options: { duration: hours(3, 5), priority: 1 } }],
      [{ name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 } },
      { name: 'Work', options: { duration: hours(3, 5), priority: 1 } }],
      [{ name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 } },
      { name: 'Work', options: { duration: hours(3, 5), priority: 1 } }],
    ],
    'go home': () => [
      { name: 'Go home', options: { priority: 3 } }
    ],
    'shop': () => [
      [{ name: 'Go shopping', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 } },
      { name: 'Shop', options: { duration: hours(0, 1) , priority: 2 } },
      { name: 'Go to other shops', options: { priority: 3 } }],
      [{ name: 'Go shopping', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 } },
      { name: 'Shop', options: { duration: hours(0, 1) , priority: 2 } }]
    ],
    'wander': () => [
      { name: 'Wander', options: { priority: 3 } }
    ],
    'doctor_visit': () => [
      { name: 'Visit doctor', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'GetExamined', options: { duration: hours(0, 5) } }
    ],
    'release_at_random_location': () => [
      { name: 'Go to random location', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'Release' },
    ]
  };

  const blueActivities = {
    'go home': () => [
      { name: 'Go home', options: { priority: 3 }}
    ],
    'wander': () => [
      { name: 'Go to the park', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 3 } },
      { name: 'Wander', options: { priority: 1 } }
    ],
    'patrol': () => [
      [{ name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 }}, 
      { name: 'Patrol', options: { priority: 1 } },
      { name: 'Patrol', options: { priority: 1 } }]
    ],
    'guard': () => [
      [{ name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 } },
      { name: 'Guard', options: { duration: hours(3, 5), priority: 1 } }],
      [{ name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 } },
      { name: 'Guard', options: { duration: hours(3, 5), priority: 1 } },
      { name: 'Have lunch', options: { priority: 2 } },
      { name: 'Guard', options: { duration: hours(3, 5), priority: 1 } }],
    ],
    'release_at_random_location': () => [
      { name: 'Go to random location', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'Release' },
    ]
  };

  const redActivities = {
    'go home': () => [
      { name: 'Go home', options: { priority: 3 } }
    ],
    'drop_at_random_location': () => [
      { name: 'Go to random location', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'drop object' },
    ],
    'steal_from_shop': () => [
      { name: 'Go shopping', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 } },
      { name: 'Shop', options: { duration: minutes(10) , priority: 1 } },
      { name: 'Run away', options:  { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 }  } 
    ],
  };
  
  const agendaVariations = {
    'work': () => [
      [...((activities['work']())[randomIntInRange(0,activities['work']().length-1)]),...activities['go home'](),...activities['wander'](),...activities['go home']()] as ActivityList,      
      [...((activities['work']())[randomIntInRange(0,activities['work']().length-1)]),...((activities['shop']())[randomIntInRange(0,activities['shop']().length-1)]),...activities['go home'](),...activities['wander'](),...activities['go home']()] as ActivityList,      
      [...((activities['work']())[randomIntInRange(0,activities['work']().length-1)]),...((activities['shop']())[randomIntInRange(0,activities['shop']().length-1)]),...activities['go home']()] as ActivityList,      
      [...((activities['shop']())[randomIntInRange(0,activities['shop']().length-1)]),...((activities['work']())[randomIntInRange(0,activities['work']().length-1)]),...activities['go home'](),...activities['wander'](),...activities['go home']()] as ActivityList,      
      [...((activities['shop']())[randomIntInRange(0,activities['shop']().length-1)]),...((activities['work']())[randomIntInRange(0,activities['work']().length-1)]),...activities['go home']()] as ActivityList,
      [...((activities['shop']())[randomIntInRange(0,activities['shop']().length-1)]),...activities['go home']()] as ActivityList,      
      [...((activities['shop']())[randomIntInRange(0,activities['shop']().length-1)]),...activities['wander'](),...activities['go home']()] as ActivityList,      
      [...activities['wander'](),...((activities['shop']())[randomIntInRange(0,activities['shop']().length-1)]),...activities['go home']()] as ActivityList,      
      [...activities['wander'](),...((activities['work']())[randomIntInRange(0,activities['work']().length-1)]),...activities['go home']()] as ActivityList,      
    ],
    'learn': () => [
      [...((activities['work']())[randomIntInRange(0,activities['work']().length-1)]),...activities['wander'](),...activities['go home']()] as ActivityList,      
    ],
    'police': () => [
      [...((blueActivities['guard']())[randomIntInRange(0,blueActivities['guard']().length-1)]),...activities['go home']()] as ActivityList,      
      [...((blueActivities['patrol']())[randomIntInRange(0,blueActivities['patrol']().length-1)]),...activities['go home']()] as ActivityList,      
    ],
    'red': () => [
      [...redActivities['drop_at_random_location'](), ...activities['go home']()] as ActivityList,
      //[...redActivities['steal_from_shop'](), ...activities['go home']()] as ActivityList,
    ],
    'release_at_location': () => [
      [...activities['release_at_random_location'](),...activities['go home']()] as ActivityList,      
    ],
     'null': () => [
      [...activities['wander'](),...activities['go home']()] as ActivityList,      
     ]
  };

  const agentAgendas = {
    'work': () => 
      (agendaVariations['work']())[randomIntInRange(0,agendaVariations['work']().length-1)], 
    'learn': () => 
      (agendaVariations['learn']())[randomIntInRange(0,agendaVariations['learn']().length-1)], 
    'release_at_location': () => 
      (agendaVariations['release_at_location']())[0], 
    'police_duty': () => 
      (agendaVariations['police']())[randomIntInRange(0,agendaVariations['police']().length-1)], 
    'red_activity': () =>
      (agendaVariations["red"]())[randomIntInRange(0,agendaVariations["red"]().length-1)],
    null: () => 
      (agendaVariations['null']())[randomIntInRange(0,agendaVariations['null']().length-1)], 
  };

  if(agent.type == 'group'){
    return agentAgendas['release_at_location']();
  }
  else {
  switch(agent.force) { 
    case 'white': { 
      if(agent.occupations != undefined && agent.occupations.length != 0){
        return agentAgendas[agent.occupations[0].type as keyof typeof agentAgendas]()  
      }
      else{
        return agentAgendas['work']()  }
      }
    case 'red': { 
       return agentAgendas['red_activity']()           
      } 
    case 'blue': { 
      //console.log('blue agenda',agentAgendas['police_duty']()  )
      return agentAgendas['police_duty']()    
    } 
    default: { 
      if(agent.occupations != undefined && agent.occupations.length != 0){
        return agentAgendas[agent.occupations[0].type as keyof typeof agentAgendas]()  
      }
      else{
        return agentAgendas['work']()  }
      }
    } 
    } 
 } 
 
function customAgenda(agent: IAgent, _services: IEnvServices, customAgIndex: number) {
  if (typeof agent._day === 'undefined') {
    agent._day = 0;
  } else {
    agent._day++;
  }
  const { _day: day } = agent;

  var agenda = simConfig.customAgendas[customAgIndex].agendaItems;
  agenda[0].options = {startTime:simTime(day, randomInRange(0, 4), randomInRange(0, 3))};
  //console.log( 'agentId', agent.id, 'custom agenda', agenda)
  return agenda;
}


function addReaction(agent: IAgent, services: IEnvServices) {
  agent.route = [];
  agent.steps == [];

  let timesim = services.getTime();
  timesim.setMinutes(timesim.getMinutes()+ 5);

  if(agent.agenda){
    var reactionAgenda : ActivityList = reactions["drop object"][agent.force][0];
    reactionAgenda[0].options = {startTime: timesim}
    agent.agenda = [...reactionAgenda,...agent.agenda];
  
    console.log("reaction agenda",agent.agenda)
  
    updateAgent(agent,services);
    return reactionAgenda;
  }
}


export const agendas = {
  getAgenda,
  customAgenda,
  addReaction
};