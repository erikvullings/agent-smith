/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-param-reassign */
import { IAgent, IActivityOptions, ActivityList } from '../models';
import { IEnvServices } from '../env-services';
import { dispatchServices, damageServices, messageServices, redisServices } from '.';
import { planEffects } from './plan-effects';
import { addGroup, randomItem, hours, minutes, seconds, randomPlaceNearby, randomPlaceInArea, randomIntInRange, inRangeCheck, distanceInMeters } from '../utils';

const prepareRoute = (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
  const steps = [] as ActivityList;
  const { distance } = services;
  const { startTime } = options;
  if (startTime) {
    steps.push({ name: 'waitUntil', options });
  }
  if (agent.type === 'drone') {
    steps.push({ name: 'flyTo', options: { destination: agent.destination } });
  } else if ('owns' in agent) {
    if (agent.owns && agent.owns.length > 0) {
      const ownedCar = agent.owns.filter((o) => o.type === 'car').shift();
      const car = ownedCar && services.agents[ownedCar.id];
      if (car && distance(agent.actual.coord[0], agent.actual.coord[1], car.actual.coord[0], car.actual.coord[1]) < 500 && agent.destination && distanceInMeters(agent.actual.coord[0], agent.actual.coord[1], agent.destination.coord[0], agent.destination.coord[1]) > 7500) {
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
        if (bike && distance(agent.actual.coord[0], agent.actual.coord[1], bike.actual.coord[0], bike.actual.coord[1]) < 300 && agent.destination && distanceInMeters(agent.actual.coord[0], agent.actual.coord[1], agent.destination.coord[0], agent.destination.coord[1]) > 1000) {
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
    } else {
      steps.push({ name: 'walkTo', options: { destination: agent.destination } });
    }
  }
  if (agent.running) {
    steps.push({ name: 'stopRunning' });
  } else {
    steps.push({ name: 'walkTo', options: { destination: agent.destination } });
  }
  if(agent.running){
    steps.push({ name: 'stopRunning'});
  } 
  agent.steps = steps;
};

/**
 * @param agent
 * @param services
 * @param options
/** Wait for options.duration msec */
const waitFor = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
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
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = []
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

  /** In the options, you can set the shop location to go to */
  'Go shopping': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const { destination = randomPlaceNearby(agent, 1000, 'shop') } = options;
      agent.destination = destination;
      prepareRoute(agent, services, options);

      return true;
    },
  },

  'Go to park': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const { destination = randomPlaceNearby(agent, 10000, 'park') } = options;
      agent.destination = destination;
      prepareRoute(agent, services, options);

      return true;
    },
  },

  'Go to random location': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const { destination = randomPlaceNearby(agent, 1000, 'any') } = options;
      agent.destination = destination;
      prepareRoute(agent, services, options);

      return true;
    },
  },

  'Flee the scene': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const { destination = randomPlaceNearby(agent, 1000, 'any') } = options;
      agent.destination = destination;
      agent.running = true;
      prepareRoute(agent, services, options);

      return true;
    },
  },

  'Run away': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const danger = options.areaCentre;
      const range = options.areaRange ? options.areaRange : 500;

      if (danger) {
        const slope = (agent.actual.coord[1] - danger[1]) / (agent.actual.coord[0] - danger[0]);
        const distanceDegrees = 1500 / 111139;
        const dx = Math.sqrt(2 * (distanceDegrees ** 2) * (slope ** 2));
        if (agent.actual.coord[0] > danger[0]) {
          const x = agent.actual.coord[0] + dx;
          const y = agent.actual.coord[1] + dx * slope;
          const destination = randomPlaceInArea(x, y, range, 'any');
          options.destination = destination;
          agent.destination = destination;
        } else {
          const x = agent.actual.coord[0] - dx;
          const y = agent.actual.coord[1] - dx * slope;
          const destination = randomPlaceInArea(x, y, range, 'any');
          options.destination = destination;
          agent.destination = destination;
        }
      }
      agent.running = true;
      prepareRoute(agent, services, options);
      return true;
    },
  },


  'Go to specific location': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
      if (options.destination) {
        agent.sentbox = [];
        agent.destination = options.destination;
        prepareRoute(agent, services, options);
        // agent.speed = 2;
      }
      return true;
    },
  },

  'Go to specific area': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions) => {
      if (options.areaCentre && options.areaRange) {
        agent.sentbox = [];
        const centre = options.areaCentre;
        const { destination = randomPlaceInArea(centre[0], centre[1], options.areaRange, 'any') } = options;
        agent.destination = destination;
        prepareRoute(agent, _services, options);
      }
      return true;
    },
  },

  'Go to the police station': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {},

  'Hang around specific area': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions) => {
      const steps = [] as ActivityList;
      if (options.areaCentre && options.areaRange) {
        const nOPlaces = randomIntInRange(10, 20);
        for (let i = 0; i < nOPlaces; i += 1) {
          const centre = options.areaCentre;
          const { destination = randomPlaceInArea(centre[0], centre[1], options.areaRange, 'any') } = options;
          agent.destination = destination;
          if (agent.type === 'drone') {
            steps.push({ name: 'flyTo', options: { destination } });
            steps.push({ name: 'waitFor', options: { duration: minutes(0, 2) } });
          } else {
            steps.push({ name: 'walkTo', options: { destination } });
            steps.push({ name: 'waitFor', options: { duration: minutes(0, 15) } });
          }
        }
      }
      agent.steps = steps;
      return true;
    },
  },

  'Follow person': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
      agent.sentbox = [];
      console.log("agent target", [services.agents[agent.following]])
      //console.log('agent destination', agent.destination)
      if(agent.following && agent.following !== ""){
        const followedAgent = services.agents[agent.following]
        agent.destination = followedAgent.actual;
        agent.running = true;
        agent.reactedTo = "Drop object";

        
        const distanceBetween = distanceInMeters(agent.actual.coord[1],agent.actual.coord[0],followedAgent.actual.coord[1],followedAgent.actual.coord[0]);
        console.log("distance between", distanceBetween)
        if(distanceBetween < 4){

          if(planEffects[agent.reactedTo].damageLevel > 30){
            console.log("We will use weapons")
            // if distance is smaller than 4 meters send direct message to the agent 
            // to talk to the agent, if agent is dangerous
            // use weapon
            damageServices.damageAgent(agent,[followedAgent],services);
            agent.following = "";
            //take the red agent to the station and wait

          }
          else{
            console.log("We will talk to agent");
            agent.following = "";

          }
        }
        
        if(agent.following && agent.following !== ""){
          const followAgenda = [{ name: 'Follow person', options : {}}];

          if(agent.agenda){
            agent.agenda = [...followAgenda, ...agent.agenda];
          }
          else{
            agent.agenda = [...followAgenda]
          }
        }
        }

      prepareRoute(agent, services, options);
      // agent.speed = 2;
      return true;
    },
  },

  'Protect person': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
      agent.sentbox = [];
      console.log("agent target", [services.agents[agent.following]])
      //console.log('agent destination', agent.destination)
      if(agent.following && agent.following !== ""){
        const followedAgent = services.agents[agent.following]
        agent.destination = followedAgent.actual;
        const followAgenda : ActivityList = [{ name: 'Protect person', options : {priority:1}}];

        if(agent.agenda){
          agent.agenda = [...followAgenda, ...agent.agenda];
        }
        else{
          agent.agenda = [...followAgenda]
        }}
        

      prepareRoute(agent, services, options);
      // agent.speed = 2;
      return true;
    },
  },


  'Visit doctor': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
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
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
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

  Fight: { prepare: waitFor },

  // Wait: { prepare: waitFor },

  'Wait': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options });
      agent.steps = steps;
      return true;
    },
  },

  'Stay at police station': {
    prepare: async (agent: IAgent, _services: IEnvServices, _options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options: { duration: hours(5, 8) } });
      agent.steps = steps;
      return true;
    },
  },

  'Patrol': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
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
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const { destination = randomPlaceNearby(agent, 1000, 'food'), duration = minutes(20, 50) } = options;
      const steps = [] as ActivityList;
      const { actual } = agent;
      agent.destination = destination;
      steps.push({ name: 'walkTo', options: { destination } });
      steps.push({ name: 'waitFor', options: { duration } });
      steps.push({ name: 'walkTo', options: { destination: actual } });
      agent.steps = steps;
      return true;
    },
  },

  // Maybe also add "spot targets" to pick targets
  'Attack targets': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      agent.route = [];
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options });
      agent.steps = steps;

      // if(agent.targets){
        // damageServices.damageAgent(agent,'Attack targets',[services.agents["red2"]],agent.equipment,services)
      // }
      return true;
    },
  },


  'Wander': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const steps = [] as ActivityList;
      if (agent.type === 'drone') {
        const { destination = randomPlaceNearby(agent, 1000, 'road'), duration = minutes(0, 10) } = options;
        agent.destination = destination;
        steps.push({ name: 'flyTo', options: { destination } });
        if (inRangeCheck(0, 10, randomIntInRange(0, 100))) {
          steps.push({ name: 'flyTo', options: { duration } });
        }
      } else {
        const { destination = randomPlaceNearby(agent, 1000, 'any'), duration = minutes(0, 10) } = options;
        agent.destination = destination;
        steps.push({ name: 'walkTo', options: { destination } });
        if (inRangeCheck(0, 10, randomIntInRange(0, 100))) {
          steps.push({ name: 'waitFor', options: { duration } });
        }
      }
      agent.steps = steps;
      return true;
    },
  },

  'Wander_drone': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      const { destination = randomPlaceNearby(agent, 1000, 'road'), duration = minutes(0, 10) } = options;
      const steps = [] as ActivityList;
      agent.destination = destination;
      steps.push({ name: 'flyTo', options: { destination } });
      if (inRangeCheck(0, 10, randomIntInRange(0, 100))) {
        steps.push({ name: 'flyTo', options: { duration } });
      }
      agent.steps = steps;
      return true;
    },
  },

  'Release': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const steps = [] as ActivityList;
      if (agent.group) {
        const release = agent.group.filter((a) => a in services.agents)
        steps.push({ name: 'releaseAgents', options: { duration: minutes(1), release } });
      }
      else {
        const { duration = minutes(1) } = options;
        steps.push({ name: 'waitFor', options: { duration } });
      }
      agent.steps = steps;
      return true;
    },
  },

  'Release_red': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      const steps = [] as ActivityList;
      if (agent.group && agent.force === 'white') {
        const existing = agent.group.filter((a) => a in services.agents)
        const red = existing.filter((a) => services.agents[a].force === 'red');
        for (const i of red) {
          steps.push({ name: 'releaseAgents', options: { release: [i] } });
          steps.push({ name: 'waitFor', options: { duration: minutes(2) } });
          const member = services.agents[i];
          if (member.agenda && member.agenda.length > 0) {
            member.agenda.splice(0, 0, { name: 'Join red group' });
          } else {
            member.agenda = [{ name: 'Join red group' }];
          }
        }
      }
      else {
        const { duration = minutes(1) } = options;
        steps.push({ name: 'waitFor', options: { duration } });
      }
      agent.steps = steps;
      return true;
    },
  },

  'Join red group': {
    prepare: async (agent: IAgent, _services: IEnvServices, _options: IActivityOptions = {}) => {
      const steps = [] as ActivityList;
      const inRange = await redisServices.geoSearch(agent.actual, 1000, agent);
      const agentsInRange = inRange.map((a: any) => a = _services.agents[a.key]);
      const redGroups = agentsInRange.filter((a: IAgent) => (a.type === 'group' && a.force === 'red'));
      if (redGroups.length > 0) {
        const newGroup = randomItem(redGroups);
        steps.push({ name: 'walkTo', options: { destination: newGroup.actual } });
        steps.push({ name: 'joinGroup', options: { group: newGroup.id } })
      }
      agent.steps = steps;
      return true;
    },
  },

  'Drop object': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const objectTypes = ['bomb', 'gas', 'object']
      const steps = [] as ActivityList;
      let objects: string[];
      let objectAgent: IAgent;
      if (agent.group) {
        objects = agent.group.filter((a) => objectTypes.indexOf(services.agents[a].type) >= 0);
        if (objects && objects.length > 0) {
          objectAgent = services.agents[objects[0]];
          delete objectAgent.memberOf;
          agent.group = agent.group.filter((a) => a !== objectAgent.id);

          agent.visibleForce = 'red';
          if (objectAgent.type === 'bomb') {
            messageServices.sendMessage(objectAgent, 'drop bomb', services);
          } else if (objectAgent.type === 'gas') {
            messageServices.sendMessage(objectAgent, 'drop gas', services);
            const objectSteps = [] as ActivityList;
            objectSteps.push({ name: 'waitFor', options: { duration: minutes(5) } });
            objectAgent.actual = agent.actual;
            objectAgent.steps = objectSteps;
          } else {
            messageServices.sendMessage(objectAgent, 'drop object', services);
          }
        }
      }
      const duration = minutes(1);
      steps.push({ name: 'waitFor', options: { duration } });
      console.log('drop');
      agent.steps = steps;
      return true;
    },
  },

  'Play Message': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const steps = [] as ActivityList;
      const duration = minutes(1);
      steps.push({ name: 'waitFor', options: { duration } });
      agent.steps = steps;
      agent.visibleForce = 'red';
      // messageServices.sendDamage(agent,'drop object',[services.agents["biker"]],services);

      // if(objectAgent){
      //   messageServices.sendMessage(objectAgent, 'Drop object', services);
      // }
      messageServices.sendMessage(agent, 'Play Message', services);
      return true;
    },
  },

  'Check object': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const steps = [] as ActivityList;
      // if(agent.group){
      //   agent.group.filter((a) => services.agents[a].type === 'object').map((a) => delete services.agents[a].memberOf);
      //   agent.group = agent.group.filter((a) => services.agents[a].type !== 'object')
      // }
      const { duration = minutes(5, 15) } = options;
      steps.push({ name: 'waitFor', options: { duration } });
      agent.steps = steps;
      return true;
    },
  },

  'Call the police': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const steps = [] as ActivityList;
      const { duration = minutes(1, 10) } = options;
      steps.push({ name: 'waitFor', options: { duration } });
      agent.steps = steps;

      // const receivers = await redisServices.geoSearch(agent.actual, 100000, agent) as Array<any>;
      // const receiversAgents = (receivers.map((a) => a = services.agents[a.key])).filter(a => ("department" in a) && a.department === 'station' && a.agenda && (a.agenda[0].options?.reacting === undefined || a.agenda[0].options?.reacting === false));
      // console.log("receivers", receiversAgents)
      // messageServices.sendDirectMessage(agent, "Call the police", [receiversAgents[0]], services);
      agent.reactedTo = 'Drop object'
      dispatchServices.sendDefence(agent,services);

      return true;
    },
  },

  'Go to other shops': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = [];
      const steps = [] as ActivityList;
      const { actual } = agent;
      const noshops = randomIntInRange(2, 5)
      for (let i = 0; i < noshops; i += 1) {
        const { destination = randomPlaceNearby(agent, 300, 'shop'), duration = minutes(15, 30) } = options;
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
}
