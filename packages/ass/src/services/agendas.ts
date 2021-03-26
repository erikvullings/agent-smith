import { IAgent } from '../models';
import { simTime, hours, randomInRange} from '../utils';
import { IEnvServices } from '../env-services';
import * as simConfig from "../sim_config.json";

function getAgenda(agent: IAgent, _services: IEnvServices) {
  if (typeof agent._day === 'undefined') {
    agent._day = 0;
  } else {
    agent._day++;
  }
  const { _day: day } = agent;

  if(agent.occupations && agent.occupations != undefined) {
    switch (agent.occupations[0].type) {
      case 'work': {
        return [
          { name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
          { name: 'Work', options: { duration: hours(3, 5) } },
          { name: 'Have lunch' },
          { name: 'Work', options: { duration: hours(3, 5) } },
          { name: 'Go to other shops' },
          { name: 'Go home' },
        ];
      }
      case 'shop': {
        return [
          { name: 'Go shopping', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
          { name: 'Shop', options: { duration: hours(0, 1) } },
          //{ name: 'Go to other shops' },
          { name: 'Go to other shops' },
          { name: 'Wander' },
          { name: 'Go home' },
        ];
      }
      case 'wander': {
        return [
          { name: 'Go to the park', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
          { name: 'Wander' },
          { name: 'Wander' },
          { name: 'Go home' },
        ];
      }
      case 'doctor_visit': {
        return [
          { name: 'Visit doctor', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
          { name: 'GetExamined', options: { duration: hours(0, 5) } },
          { name: 'Go home' },
        ];
      }
      default: {
        return [
          { name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
          { name: 'Work', options: { duration: hours(3, 5) } },
          { name: 'Have lunch' },
          { name: 'Work', options: { duration: hours(3, 5) } },
          { name: 'Go home' },
        ];
      }
    }  
  }
  else {
    return [
      { name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'Work', options: { duration: hours(3, 5) } },
      { name: 'Have lunch' },
      { name: 'Work', options: { duration: hours(3, 5) } },
      { name: 'Go home' },
    ];
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