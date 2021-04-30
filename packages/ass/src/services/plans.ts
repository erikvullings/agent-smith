import { IAgent, IGroup, IActivityOptions, ActivityList } from '../models';
import { executeSteps, IEnvServices } from '../env-services';
import { addGroup, randomItem, minutes, randomPlaceNearby, randomIntInRange, inRangeCheck, distanceInMeters } from '../utils';
import { redisServices } from './redis-service';
import { messageServices } from './message-service';



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
      if (car && distance(agent.actual.coord[0], agent.actual.coord[1], car.actual.coord[0], car.actual.coord[1]) < 500 && agent.destination && distanceInMeters(agent.actual.coord[0], agent.actual.coord[1], agent.destination.coord[0], agent.destination.coord[1]) > 7500){
        car.force = agent.force;
        car.group = [agent.id];
        addGroup(agent, car, services);
        steps.push({ name: 'walkTo', options: { destination: car.actual } });
        steps.push({ name: 'controlAgents', options: { control: [car.id] } });
        steps.push({ name: 'driveTo', options: { destination: agent.destination } });
        steps.push({ name: 'releaseAgents', options: { release: [car.id] } });
      } else {
        const ownedBike = agent.owns.filter((o) => o.type === 'bicycle').shift();
        const bike = ownedBike && services.agents[ownedBike.id];
        if (bike && distance(agent.actual.coord[0], agent.actual.coord[1], bike.actual.coord[0], bike.actual.coord[1]) < 300 && agent.destination && distanceInMeters(agent.actual.coord[0], agent.actual.coord[1], agent.destination.coord[0], agent.destination.coord[1]) > 1000){
            bike.force = agent.force;
            bike.group = [agent.id];
            addGroup(agent, bike, services);
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
        let arr = await redisServices.geoSearch(agent.actual, "100", agent);
        messageServices.sendMessage(agent, "went to work", arr); 
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
      const { destination = randomPlaceNearby(agent, 1000, 'shop') } = options;
      agent.destination = destination;
      prepareRoute(agent, services, options);

    return true;
    },
  },
  
  'Go to the park': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
      const { destination = randomPlaceNearby(agent, 10000, 'park') } = options;
      agent.destination = destination;
      prepareRoute(agent, services, options);
  
      return true;
    },
  },

  'Go to random location': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
      const {destination = randomPlaceNearby(agent, 1000, 'any')} = options;
      agent.destination = destination;
      prepareRoute(agent, services, options);
      
      return true;      
    },
  },

  'Run away': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions = {}) => {
      const {destination = randomPlaceNearby(agent, 10000, 'any')} = options;
      agent.destination = destination;
      prepareRoute(agent, services, options);
      agent.speed = 2;
      return true;      
    },
  },
  
  'Go to specific location': {
    prepare: async (agent: IAgent | IGroup, services: IEnvServices, options: IActivityOptions) => {
      const steps = [] as ActivityList;
      //const { destination } = options;
      //agent.destination = destination;

      steps.push({ name: 'walkTo', options: options});
      agent.steps = steps;

      //agent.steps = steps;
      //const {destination = agent.destination} = options;
      //agent.destination = destination;
      //prepareRoute(agent, services, options);

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

  Guard: { prepare: waitFor },

  GetExamined: { prepare: waitFor },

  Chat: { prepare: waitFor },

  //Wait: { prepare: waitFor },

  'Wait': {
    prepare: async (agent: IAgent | IGroup, _services: IEnvServices, options: IActivityOptions = {}) => {
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options: options});
      agent.steps = steps;
      return true;
    },
  },

  'Patrol': {
    prepare: async (agent: IAgent | IGroup, _services: IEnvServices, options: IActivityOptions = {}) => {
      const { destination = randomPlaceNearby(agent, 1000, 'road') } = options;
      const steps = [] as ActivityList;
      agent.destination = destination;
      steps.push({ name: 'walkTo', options: { destination } });
      agent.steps = steps;
      return true;
    },
  },

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
        const {release = agent.group, duration = minutes(1)} = options;
        for (let i of release){
          const member = _services.agents[i];
          if(member.memberOf == agent.id){
            delete member.memberOf;
          }
        }
        delete agent.group;
        delete agent.membercount;
        steps.push({ name: 'waitFor', options: { duration } });
      }
      else{
        const {duration = minutes(1)} = options;
        steps.push({ name: 'waitFor', options: { duration } });
      }
      agent.steps = steps;
      return true;
    },
  },

  'drop object':{
    prepare: async (agent: IAgent | IGroup, _services: IEnvServices, options: IActivityOptions = {}) => {
      const steps = [] as ActivityList;
      if(agent.group){
        agent.group.filter((a) => _services.agents[a].type == 'object').map((a) => delete _services.agents[a].memberOf);
        agent.group = agent.group.filter((a) => _services.agents[a].type !== 'object')
      }
      const {duration = minutes(0.5)} = options;
      steps.push({ name: 'waitFor', options: { duration } });
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
}
