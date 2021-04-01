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
  const activities = {
    'work': function () {
      return [
        { name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 } },
        { name: 'Work', options: { duration: hours(3, 5), priority: 1 } },
        { name: 'Have lunch', options: { priority: 3 } },
        { name: 'Work', options: { duration: hours(3, 5), priority: 1 } },
      ];
    },
    'go home': function () {
      return [
        { name: 'Go home', options: { priority: 3 } },
      ];
    },
    'shop': function () {
      return [
        { name: 'Go shopping', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 } },
        { name: 'Shop', options: { duration: hours(0, 1) }, priority: 2 },
        { name: 'Go to other shops', options: { priority: 3 } },
      ];
    },
    'wander': function () {
      return [
        //{ name: 'Go to the park', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 3 } },
        { name: 'Wander', options: { priority: 3 } },
      ];
    },
    'doctor_visit': function () {
      return [
        { name: 'Visit doctor', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
        { name: 'GetExamined', options: { duration: hours(0, 5) } },
      ];
    },
    'default': function () {
      return [
        { name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
        { name: 'Work', options: { duration: hours(3, 5) } },
        { name: 'Have lunch' },
        { name: 'Work', options: { duration: hours(3, 5) } },
        { name: 'Go home' },
      ];
    }
  };

  const agentAgendas = {
    'work': function () {
      return Array.prototype.concat.apply([], [activities['work'](), activities['go home'](),activities['wander']()]);
    },
    'learn': function () {
      return Array.prototype.concat.apply([], [activities['work'](), activities['wander'](), activities['go home']()]);
    },
    'wander': function () {
      return Array.prototype.concat.apply([], [activities['wander'](), activities['go home']()]);
    },
    null: function () {
      return Array.prototype.concat.apply([], [activities['wander'](), activities['go home']()]);
    },
  };

  if(agent.occupations != undefined && agent.occupations.length != 0){
    return agentAgendas[agent.occupations[0].type as keyof typeof agentAgendas]()  }
  else{
    //var test1 = agentAgendas['null']();
    return agentAgendas['work']()  }
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