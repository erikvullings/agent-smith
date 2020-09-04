import { IAgent } from '../models';
import { IEnvServices } from '../env-services';
import { randomItem } from '../utils';
import distance from '@turf/distance';

export const plans = {
  'Go to work': {
    prepare: async (agent: IAgent, services: IEnvServices) => {
      if (agent.occupations) {
        const occupations = agent.occupations.filter((o) => o.type === 'work');
        if (occupations.length > 0) {
          const occupation = randomItem(occupations);
          agent.destination = services.locations[occupation.id].location;
          const steps = [];
          if (agent.owns && agent.owns.length > 0) {
            const ownedCar = agent.owns.filter((o) => o.type === 'car').shift();
            const car = ownedCar && services.agents[ownedCar.id];
            if (car && distance(agent.actual, car.actual, { units: 'meters' }) < 500) {
              steps.push({ name: 'walkTo', options: { destination: car.actual } });
              steps.push({ name: 'driveTo', options: { destination: agent.destination } });
            } else {
              const ownedBike = agent.owns.filter((o) => o.type === 'bike').shift();
              const bike = ownedBike && services.agents[ownedBike.id];
              if (bike && distance(agent.actual, bike.actual, { units: 'meters' }) < 300) {
                steps.push({ name: 'walkTo', options: { destination: bike.actual } });
                steps.push({ name: 'cycleTo', options: { destination: agent.destination } });
              } else {
                steps.push({ name: 'walkTo', options: { destination: agent.destination } });
              }
            }
          } else {
            steps.push({ name: 'walkTo', options: { destination: agent.destination } });
          }
          agent.steps = steps;
        }
      }
      return true;
    },
  },
};
