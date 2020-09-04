import { IAgent, IActivityOptions } from '../models';
import { IEnvServices } from '../env-services';
import { randomItem, log } from '../utils';
import distance from '@turf/distance';

const prepareRoute = (agent: IAgent, services: IEnvServices) => {
  const steps = [] as Array<{ name: string; options?: IActivityOptions }>;
  if (agent.owns && agent.owns.length > 0) {
    const ownedCar = agent.owns.filter((o) => o.type === 'car').shift();
    const car = ownedCar && services.agents[ownedCar.id];
    if (car && distance(agent.actual.coord, car.actual.coord, { units: 'meters' }) < 500) {
      steps.push({ name: 'walkTo', options: { destination: car.actual } });
      steps.push({ name: 'driveTo', options: { destination: agent.destination } });
    } else {
      const ownedBike = agent.owns.filter((o) => o.type === 'bike').shift();
      const bike = ownedBike && services.agents[ownedBike.id];
      if (bike && distance(agent.actual.coord, bike.actual.coord, { units: 'meters' }) < 300) {
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
};

export const plans = {
  /** In the options, you can set the work location to go to */
  'Go to work': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      if (!agent.occupations) {
        return true;
      }
      const occupations = agent.occupations.filter((o) => o.type === 'work');
      if (occupations.length > 0) {
        const { location } = options;
        const occupation =
          (location && occupations.filter((o) => o.id === location).shift()) || randomItem(occupations);
        agent.destination = services.locations[occupation.id];
        prepareRoute(agent, services);
      }
      return true;
    },
  },
  /** In the options, you can set the shop location to go to */
  'Go shopping': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      if (!agent.occupations) {
        return true;
      }
      const occupations = agent.occupations.filter((o) => o.type === 'shop');
      if (occupations.length > 0) {
        const { location } = options;
        const occupation =
          (location && occupations.filter((o) => o.id === location).shift()) || randomItem(occupations);
        agent.destination = services.locations[occupation.id];
        prepareRoute(agent, services);
      }
      return true;
    },
  },
  'Go home': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
      if (options) {
        log(options);
      }
      if (agent.home) {
        agent.destination = services.locations[agent.home.id];
        prepareRoute(agent, services);
      }
      return true;
    },
  },
};
