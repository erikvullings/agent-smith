import { IAgent } from '../models';
import { simTime, hours, randomInRange} from '../utils';
import { IEnvServices } from '../env-services';

function getAgenda(agent: IAgent, _services: IEnvServices) {
  if (typeof agent._day === 'undefined') {
    agent._day = 0;
  } else {
    agent._day++;
  }
  const { _day: day } = agent;

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
        { name: 'Go to other shops' },
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

export const agendas = {
  getAgenda,
};