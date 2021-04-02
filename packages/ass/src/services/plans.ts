import { IAgent, IGroup, IActivityOptions, ActivityList } from '../models';
import { IEnvServices } from '../env-services';
import { randomItem, minutes, randomPlaceNearby, randomIntInRange, inRangeCheck } from '../utils';

const prepareRoute = (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions) => {
  const steps = [] as ActivityList;
  const { distance } = services;
  const { startTime } = options;
  if (startTime) {
    steps.push({ name: 'waitUntil', options });
  }
  if ('owns' in agent){
    if (agent.owns && agent.owns.length > 0) {
      const ownedCar = agent.owns.filter((o) => o.type === 'car').shift();
      const car = ownedCar && services.agents[ownedCar.id];
      if (car && distance(agent.actual.coord[0], agent.actual.coord[1], car.actual.coord[0], car.actual.coord[1]) < 500) {
        steps.push({ name: 'walkTo', options: { destination: car.actual } });
        steps.push({ name: 'controlAgents', options: { control: [car.id] } });
        steps.push({ name: 'driveTo', options: { destination: agent.destination } });
        steps.push({ name: 'releaseAgents', options: { release: [car.id] } });
      } else {
        const ownedBike = agent.owns.filter((o) => o.type === 'bicycle').shift();
        const bike = ownedBike && services.agents[ownedBike.id];
        if (
          bike &&
          distance(agent.actual.coord[0], agent.actual.coord[1], bike.actual.coord[0], bike.actual.coord[1]) < 300
        ) {
          steps.push({ name: 'walkTo', options: { destination: bike.actual } });
          steps.push({ name: 'controlAgents', options: { control: [bike.id] } });
          steps.push({ name: 'cycleTo', options: { destination: agent.destination } });
          steps.push({ name: 'releaseAgents', options: { release: [bike.id] } });
        } else {
          steps.push({ name: 'walkTo', options: { destination: agent.destination } });
        }
      }
    }else {
      steps.push({ name: 'walkTo', options: { destination: agent.destination } });
    } 
  } else {
    steps.push({ name: 'walkTo', options: { destination: agent.destination } });
  }
  agent.steps = steps;
};

/** Wait for options.duration msec */
const waitFor = async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
  const { duration } = options;
  if (duration) {
    const startTime = new Date(services.getTime().valueOf() + duration);
    agent.steps = [{ name: 'waitUntil', options: { startTime } }];
  }
  return true;
};

/** All plans that are available to each agent */
export const plans = {
  /** In the options, you can set the work location to go to */
  'Go to work': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
      if (!agent.occupations) {
        return true;
      }
      const occupations = agent.occupations.filter((o) => o.type === 'work');
      if (occupations.length > 0) {
        const { destination } = options;
        const occupation =
          (destination && occupations.filter((o) => o.id === destination.type).shift()) || randomItem(occupations);
        agent.destination = services.locations[occupation.id];
        prepareRoute(agent, services, options);
      }
      return true;
    },
  },
  /** In the options, you can set the school location to go to */
  'Go to school': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
      if (!agent.occupations) {
        return true;
      }
      const occupations = agent.occupations.filter((o) => o.type === 'school');
      if (occupations.length > 0) {
        const { destination } = options;
        const occupation =
          (destination && occupations.filter((o) => o.id === destination.type).shift()) || randomItem(occupations);
        agent.destination = services.locations[occupation.id];
        prepareRoute(agent, services, options);
      }
      return true;
    },
  },
  /** In the options, you can set the shop location to go to */
  'Go shopping': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
      if (!agent.occupations) {
        return true;
      }
      const occupations = agent.occupations.filter((o) => o.type === 'shop');
      if (occupations.length > 0) {
        const { destination } = options;
        const occupation =
          (destination && occupations.filter((o) => o.id === destination.type).shift()) || randomItem(occupations);
        agent.destination = services.locations[occupation.id];
        prepareRoute(agent, services, options);
      }
      return true;
    },
  },

  'Go to the park': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
      if (!agent.occupations) {
        return true;
      }
      const occupations = agent.occupations.filter((o) => o.type === 'wander');
      if (occupations.length > 0) {
        const { destination } = options;
        const occupation =
          (destination && occupations.filter((o) => o.id === destination.type).shift()) || randomItem(occupations);
        agent.destination = services.locations[occupation.id];
        prepareRoute(agent, services, options);
      }
      return true;
    },
  },

  'Go to the location': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
      if (!agent.occupations) {
        return true;
      }
      const occupations = agent.occupations.filter((o) => o.type === 'release_at_location');
      if (occupations.length > 0) {
        const { destination } = options;
        const occupation =
          (destination && occupations.filter((o) => o.id === destination.type).shift()) || randomItem(occupations);
        agent.destination = services.locations[occupation.id];
        prepareRoute(agent, services, options);
      }
      return true;
    },
  },

  'Visit doctor': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
      if (!agent.occupations) {
        return true;
      }
      const occupations = agent.occupations.filter((o) => o.type === 'doctor_visit');
      if (occupations.length > 0) {
        const { destination } = options;
        const occupation =
          (destination && occupations.filter((o) => o.id === destination.type).shift()) || randomItem(occupations);
        agent.destination = services.locations[occupation.id];
        prepareRoute(agent, services, options);
      }
      return true;
    },
  },


  /** Go to your home address */
  'Go home': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
      if (agent.home) {
        agent.destination = agent.home;
        prepareRoute(agent, services, options);
      }
      return true;
    },
  },
  /** Work for a number of hours (set duration in the options) */
  Work: { prepare: waitFor },

  Shop: { prepare: waitFor },

  GetExamined: { prepare: waitFor },


  /** Either go to a restaurant, have lunch, and return to your previous location, or have lunch on the spot if no destination is provided. */
  'Have lunch': {
    prepare: async (agent: IAgent | IGroup, _services: IEnvServices, options: IActivityOptions = {}) => {
      const { destination = randomPlaceNearby(agent, 1000, 'food'), duration = minutes(20, 50) } = options;
      const steps = [] as ActivityList;
      const actual = agent.actual;
      agent.destination = destination;
      steps.push({ name: 'walkTo', options: { destination } });
      steps.push({ name: 'waitFor', options: { duration } });
      steps.push({ name: 'walkTo', options: { destination: actual } });
      agent.steps = steps;
      return true;
    },
  },
  
  'Wander': {
    prepare: async (agent: IAgent | IGroup, _services: IEnvServices, options: IActivityOptions = {}) => {
      const { destination = randomPlaceNearby(agent, 1000, 'road'), duration = minutes(0, 10) } = options;
      const steps = [] as ActivityList;
      agent.destination = destination;
      steps.push({ name: 'walkTo', options: { destination } });
      if (inRangeCheck(0,10,randomIntInRange(0,100))){
        steps.push({ name: 'waitFor', options: { duration } });
      }
      agent.steps = steps;
      return true;
    },
  },
  'Release':{
    prepare: async (agent: IAgent | IGroup, _services: IEnvServices, options: IActivityOptions = {}) => {
      const steps = [] as ActivityList;
      if(agent.group){
        const {release = agent.group, duration = minutes(5)} = options;
        for (let i of release){
          const member = _services.agents[i];
          delete member.memberOf;
        }
        delete agent.group;
        steps.push({ name: 'waitFor', options: { duration } });
      }
      else{
        const {duration = minutes(5)} = options;
        steps.push({ name: 'waitFor', options: { duration } });
      }
      agent.steps = steps;
      return true;
    },
  },

  'Go to other shops': {
    prepare: async (agent: IAgent | IGroup, _services: IEnvServices, options: IActivityOptions = {}) => {
      const steps = [] as ActivityList;
      const actual = agent.actual;
      const noshops = randomIntInRange(2,5) 
      for(let i = 0; i < noshops; i +=1) {
        const {destination = randomPlaceNearby(agent, 300, 'shop'), duration = minutes(15, 30)} = options;
        agent.destination = destination;
        steps.push({ name: 'walkTo', options: { destination } });
        steps.push({ name: 'waitFor', options: { duration } });
      }
      steps.push({ name: 'walkTo', options: { destination: actual } });
      agent.steps = steps;
      return true;
    },
  },
};
