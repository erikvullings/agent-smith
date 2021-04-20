import { IAgent } from '../models';
import { IGroup } from '../models';
import { simTime, hours, randomInRange, randomIntInRange} from '../utils';
import { IEnvServices } from '../env-services';
import * as simConfig from "../sim_config.json";

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
      //{ name: 'Go to the park', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 3 } },
      { name: 'Wander', options: { priority: 3 } }
    ],
    'doctor_visit': () => [
      { name: 'Visit doctor', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'GetExamined', options: { duration: hours(0, 5) } }
    ],
    'release_at_location': () => [
      { name: 'Go to the location', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
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
      //{ name: 'Go to the park', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 3 } },
      [{ name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 }}, 
      { name: 'Patrol', options: { priority: 1 } },
      { name: 'Patrol', options: { priority: 1 } }]
    ],
    'guard': () => [
      //{ name: 'Go to the park', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 3 } },
      [{ name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 } },
      { name: 'Guard', options: { duration: hours(3, 5), priority: 1 } }],
      [{ name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 } },
      { name: 'Guard', options: { duration: hours(3, 5), priority: 1 } },
      { name: 'Have lunch', options: { priority: 2 } },
      { name: 'Guard', options: { duration: hours(3, 5), priority: 1 } }],
    ],
    'release_at_location': () => [
      { name: 'Go to the location', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'Release' },
    ]
  };
  
  const agendaVariations = {
    'work': () => [
      Array.prototype.concat.apply([], [(activities["work"]())[randomIntInRange(0,activities["work"]().length-1)], 
      activities['go home'](),activities['wander']()]),
      Array.prototype.concat.apply([], [(activities["work"]())[randomIntInRange(0,activities["work"]().length-1)], 
      activities['shop']()[randomIntInRange(0,activities["shop"]().length-1)],activities['go home']()]),
      Array.prototype.concat.apply([], [(activities["work"]())[randomIntInRange(0,activities["work"]().length-1)], 
      activities['wander'](),activities['go home']()]),
      Array.prototype.concat.apply([], [activities['shop']()[randomIntInRange(0,activities["shop"]().length-1)],(activities["work"]())[randomIntInRange(0,activities["work"]().length-1)], 
      activities['go home']()]),
    ],
    'learn': () => [
      Array.prototype.concat.apply([], [activities['work']()[randomIntInRange(0,activities["work"]().length-1)], activities['wander'](), activities['go home']()]),
    ],
    'police': () => [
      Array.prototype.concat.apply([], [blueActivities['guard']()[randomIntInRange(0,blueActivities["guard"]().length-1)], activities['go home']()]),
      Array.prototype.concat.apply([], [blueActivities['patrol']()[randomIntInRange(0,blueActivities["patrol"]().length-1)], activities['go home']()]),
    ],
    'release_at_location': () => [
      Array.prototype.concat.apply([], [activities['release_at_location'](), activities['go home']()]),
    ],
     null: () => [
      Array.prototype.concat.apply([], [activities['wander'](), activities['go home']()])
     ]
  };

  const agentAgendas = {
    'work': () => 
      (agendaVariations["work"]())[randomIntInRange(0,agendaVariations["work"]().length-1)], 
    'learn': () => 
      (agendaVariations["learn"]())[randomIntInRange(0,agendaVariations["learn"]().length-1)], 
    'release_at_location': () => 
      (agendaVariations["release_at_location"]())[0], 
    'police_duty': () => 
      (agendaVariations["police"]())[randomIntInRange(0,agendaVariations["police"]().length-1)], 
    null: () => 
      (agendaVariations["work"]())[randomIntInRange(0,agendaVariations["work"]().length-1)], 
  };

  if(agent.type == 'group'){
    return agentAgendas['release_at_location']();
    //return agentAgendas['shop']();
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
       return agentAgendas['work']()      
      } 
    case 'blue': { 
      console.log("blue agenda",agentAgendas['police_duty']()  )
      return agentAgendas['police_duty']()    
    } 
    default: { 
      if(agent.occupations != undefined && agent.occupations.length != 0){
        console.log(agentAgendas[agent.occupations[0].type as keyof typeof agentAgendas]() )
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
    console.log(agenda)
  return agenda;
}

export const agendas = {
  getAgenda,
  customAgenda
};