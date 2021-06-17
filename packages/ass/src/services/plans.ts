
import { IAgent, IActivityOptions, ActivityList, ILocation } from '../models';
import { IEnvServices } from '../env-services';
import { damageServices } from './damage-service';
import { dispatchServices, messageServices, redisServices } from '.';
import { planEffects } from './plan-effects';
import { toTime, addGroup, randomItem, hours, minutes, randomPlaceNearby, randomPlaceInArea, randomIntInRange, inRangeCheck, distanceInMeters, determineStartTime } from '../utils';
import { agendas } from './agendas';

const prepareRoute = async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
  const steps = [] as ActivityList;
  const { distance } = services;
  const { endTime } = options;
  const { startTime } = options;
  if (endTime) {
    options.startTime = await determineStartTime(agent, services, options);
    steps.push({ name: 'waitUntil', options });
  }
  else if (startTime) {
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
  } else {
    steps.push({ name: 'walkTo', options: { destination: agent.destination } });
  }
  if (agent.running) {
    steps.push({ name: 'stopRunning' });
  }
  agent.steps = steps;
};

/**
 * @param agent
 * @param services
 * @param options
 * Wait for options.duration msec */
const waitFor = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  const { duration } = options;
  if (duration) {
    const startTimeDate = new Date(services.getTime().valueOf() + duration);
    const startTime = toTime(startTimeDate.getHours(), startTimeDate.getMinutes(), startTimeDate.getSeconds());
    agent.steps = [{ name: 'waitUntil', options: { startTime } }];
  }
  return true;
};

/**
 * @param agent
 * @param services
 * @param options
 * Wait for options.duration msec */
const prepareAgent = async (agent: IAgent) => {
  agent.sentbox = [];
  agent.visibility = 1;
  return true;
}

/** All plans that are available to each agent */
export const plans = {

  'Wait until': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      agent.sentbox = []
      const { endTime } = options;
      if (endTime) {
        options.startTime = await determineStartTime(agent, services, options);
        agent.steps = [{ name: 'waitUntil', options }];
      }
      return true;
    },
  },
  /** In the options, you can set the work location to go to */
  'Go to work': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      if (!agent.occupations) {
        return true;
      }
      const occupations = agent.occupations.filter((o) => o.type === 'work');
      if (occupations.length > 0) {
        const { destination } = options;
        const occupation =
          (destination && occupations.filter((o) => o.id === destination.type).shift()) || randomItem(occupations);
        agent.destination = services.locations[occupation.id];
        await prepareRoute(agent, services, options);
      }
      return true;
    },
  },

  /** In the options, you can set the shop location to go to */
  'Go shopping': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const { destination = randomPlaceNearby(agent, 1000, 'shop') } = options;
      agent.destination = destination;
      await prepareRoute(agent, services, options);

      return true;
    },
  },

  'Go to park': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const { destination = randomPlaceNearby(agent, 10000, 'park') } = options;
      agent.destination = destination;
      prepareRoute(agent, services, options);

      return true;
    },
  },

  'Go to random location': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const { destination = randomPlaceNearby(agent, 1000, 'any') } = options;
      agent.destination = destination;
      await prepareRoute(agent, services, options);

      return true;
    },
  },

  'Flee the scene': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const { destination = randomPlaceNearby(agent, 1000, 'any') } = options;
      agent.destination = destination;
      agent.running = true;
      await prepareRoute(agent, services, options);

      return true;
    },
  },

  'Run away': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const danger = options.areaCenter;
      const range = options.areaRange ? options.areaRange : 500;

      if (danger) {
        const slope = (agent.actual.coord[1] - danger[1]) / (agent.actual.coord[0] - danger[0]);
        const distanceDegrees = range / 111139;
        const dx = Math.sqrt((distanceDegrees ** 2) / (1 + (slope ** 2)));
        if (agent.actual.coord[0] > danger[0]) {
          const x = agent.actual.coord[0] + dx;
          const y = agent.actual.coord[1] + dx * slope;
          const destination = randomPlaceInArea(x, y, 10, 'any');
          options.destination = destination;
          agent.destination = destination;
        } else {
          const x = agent.actual.coord[0] - dx;
          const y = agent.actual.coord[1] - dx * slope;
          const destination = randomPlaceInArea(x, y, 10, 'any');
          options.destination = destination;
          agent.destination = destination;
        }
      }
      agent.running = true;
      await prepareRoute(agent, services, options);
      return true;
    },
  },


  'Go to specific location': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
      if (options.destination) {
        await prepareAgent(agent);
        agent.destination = options.destination;
        await prepareRoute(agent, services, options);
      }
      return true;
    },
  },

  'Walk to person': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
      agent.route = [];
      agent.steps = [];
      if (agent.following) {
        const followedAgent: IAgent = services.agents[agent.following];
        await prepareAgent(agent);
        agent.destination = followedAgent.actual;

        messageServices.sendDirectMessage(agent, 'Walk to person', [followedAgent], services)
      }
      prepareRoute(agent, services, options);
      return true;
    },
  },

  'Go to base': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
      if (options.destination) {
        await prepareAgent(agent);
        agent.destination = options.destination;
      }
      else if (agent.baseLocation) {
        agent.destination = services.locations[agent.baseLocation];
      }

      if (agent.agenda) {
        agent.agenda = [agent.agenda[0], { name: 'Wait', options: { duration: minutes(300) } }]
      }

      agent.speed = 2;
      prepareRoute(agent, services, options);
      return true;
    },
  },

  'Go to specific area': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions) => {
      if (options.areaCenter && options.areaRange) {
        agent.sentbox = [];
        const center = options.areaCenter;
        const { destination = randomPlaceInArea(center[0], center[1], options.areaRange, 'any') } = options;
        agent.destination = destination;
        await prepareRoute(agent, _services, options);
      }
      return true;
    },
  },

  'Go to the police station': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
      await prepareAgent(agent);
      const policeStations: ILocation[] = [];

      for(const loc in services.locations){
        if (services.locations.hasOwnProperty(loc)) {
          if(services.locations[loc].type === 'police station'){
            policeStations.push(services.locations[loc]);
          }
        }
      }

      if(policeStations.length >0){
        agent.destination = policeStations[randomIntInRange(0,policeStations.length-1)];
      }
      else{
        const destination = randomPlaceNearby(agent, 5000, 'police station');
        agent.destination = destination;
      }

      agent.destination = services.locations['police station'];
      prepareRoute(agent, services, options);
      return true;
    },
  },


  'Hang around specific area': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions) => {
      const steps = [] as ActivityList;
      if (options.areaCenter && options.areaRange) {
        const nOPlaces = randomIntInRange(10, 20);
        for (let i = 0; i < nOPlaces; i += 1) {
          const center = options.areaCenter;
          const { destination = randomPlaceInArea(center[0], center[1], options.areaRange, 'any') } = options;
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
      await prepareAgent(agent);

      if (agent.following && agent.following !== '' && agent.reactedTo) {
        const followedAgent = services.agents[agent.following];

        agent.destination = followedAgent.actual;
        agent.running = true;
        const timesim = services.getTime();
        timesim.setSeconds(timesim.getSeconds() + 1);

        const distanceBetween = distanceInMeters(agent.actual.coord[1], agent.actual.coord[0], followedAgent.actual.coord[1], followedAgent.actual.coord[0]);

        if (distanceBetween < 60) {
          if (planEffects[agent.reactedTo] && planEffects[agent.reactedTo].damageLevel && planEffects[agent.reactedTo].damageLevel >= 70) {
            agent.target = followedAgent;
            if (followedAgent.health && followedAgent.health > 0) {
              damageServices.damageAgent(agent, [followedAgent], services);
              const attackAgenda: ActivityList = [
                { name: 'Follow person', options: { destination: followedAgent.actual } }];

              if (agent.agenda) {
                const oldAgenda = agent.agenda.filter(item => item.name !== 'Follow person');
                agent.agenda = [...attackAgenda, ...oldAgenda]
              }
              else {
                agent.agenda = [...attackAgenda]
              }
            }
            else {
              agent.following = '';

              const attackAgenda: ActivityList = [
                { name: 'Wait', options: { priority: 3, duration: minutes(5) } },
              ];

              if (agent.agenda) {
                const oldAgenda = agent.agenda.filter(item => item.name !== 'Follow person');
                agent.agenda = [...attackAgenda, ...oldAgenda]
              }
              else {
                agent.agenda = [...attackAgenda]
              }
            }

          }
          else if (planEffects[agent.reactedTo] && planEffects[agent.reactedTo].damageLevel && planEffects[agent.reactedTo].damageLevel > 30) {
            console.log('We will use weapons')

            agent.following = '';
            agent.target = followedAgent;
            const attackAgenda: ActivityList = [
              { name: 'Wait', options: { priority: 3, duration: minutes(5) } },
            ];

            damageServices.damageAgent(agent, [followedAgent], services);

            if (agent.agenda) {
              const oldAgenda = agent.agenda.filter(item => item.name !== 'Follow person');
              agent.agenda = [...attackAgenda, ...oldAgenda]
            }
            else {
              agent.agenda = [...attackAgenda]
            }

          }
          else {
            agent.following = '';
            const interrogationAgenda: ActivityList = [
              { name: 'Follow person', options: { priority: 3, destination: followedAgent.actual } },
              { name: 'Interrogation', options: { priority: 3 } },
            ];

            messageServices.sendDirectMessage(agent, 'Interrogation', [followedAgent], services)

            if (agent.agenda) {
              const oldAgenda = agent.agenda.filter(item => item.name !== 'Follow person')
              agent.agenda = [...interrogationAgenda, ...oldAgenda]

            }
            else {
              agent.agenda = [...interrogationAgenda]
            }

          }
        }

        let followCount = 0;
        agent.agenda?.filter(item => item.name === 'Follow person').map(item => followCount += 1);

        if (agent.following && agent.following !== '' && followCount < 2) {
          const followAgenda = [{ name: 'Follow person', options: { destination: followedAgent.actual } }];

          if (agent.agenda) {
            agent.agenda = [...followAgenda, ...agent.agenda];
          }
          else {
            agent.agenda = [...followAgenda]
          }
        }
      }

      prepareRoute(agent, services, options);
      agent.speed = 2;
      return true;
    },
  },

  'Protect person': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
      await prepareAgent(agent);

      if (agent.following && agent.following !== '') {
        const followedAgent = services.agents[agent.following];
        agent.destination = followedAgent.actual;
        const timesim = services.getTime();
        timesim.setSeconds(timesim.getSeconds() + 1);

        if (agent.following && agent.following !== '') {
          const followAgenda = [{ name: 'Protect person', options: { destination: followedAgent.actual } }];

          if (agent.agenda) {
            agent.agenda = [...followAgenda, ...agent.agenda];
          }
          else {
            agent.agenda = [...followAgenda]
          }
        }
      }

      prepareRoute(agent, services, options);
      return true;
    },
  },


  'Visit doctor': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const medicalLoc: ILocation[] = [];

      for(const loc in services.locations){
        if (services.locations.hasOwnProperty(loc)) {
          if(services.locations[loc].type === 'medical'){
            medicalLoc.push(services.locations[loc]);
          }
        }
      }

      if(medicalLoc.length >0){
        agent.destination = medicalLoc[randomIntInRange(0,medicalLoc.length-1)];
      }
      else{
        const destination = randomPlaceNearby(agent, 5000, 'medical');
        agent.destination = destination;
      }
      await prepareRoute(agent, services, options);
      return true;
    },
  },

  /** Go to your home address */
  'Go home': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      if (agent.home) {
        agent.destination = agent.home;
        await prepareRoute(agent, services, options);
      }
      return true;
    },
  },
  /** Work for a number of hours (set duration in the options) */
  Work: { prepare: waitFor },

  Shop: { prepare: waitFor },

  Guard: { prepare: waitFor },

  GetExamined: { prepare: waitFor },

  Fight: { prepare: waitFor },

  // Wait: { prepare: waitFor },

  'Wait': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options });
      agent.steps = steps;
      return true;
    },
  },

  'Wait for person': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options: { duration: minutes(20) } });
      agent.steps = steps;
      return true;
    },
  },


  'Chat': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options: { duration: minutes(10) } });

      if (agent.agenda && agent.agenda[0].options?.reacting && agent.agenda[0].options?.reacting === true) {
        agent.steps = steps;
        return true;
      }

      console.log('following', agent.following)
      if (agent.following && agent.following !== '') {
        messageServices.sendDirectMessage(agent, 'Chat', [services.agents[agent.following]], services);
      }
      else {
        agent.steps = [];

        const oldAgenda = agent.agenda?.splice(0, 1);
        agent.agenda = oldAgenda;
      }
      agent.steps = steps;
      return true;
    },
  },


  'Hide': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const steps = [] as ActivityList;
      const randomInt = randomIntInRange(0, 10);

      const destination = randomPlaceNearby(agent, 10, 'any');
      agent.destination = destination;

      const agentsNear: any[] = await redisServices.geoSearch(agent.actual, 100, agent);
      const redAgentsNear: IAgent[] = agentsNear.map(a => a = services.agents[a.key]).filter(a => a.force === 'red');

      if (randomInt >= 4) {
        steps.push({ name: 'walkTo', options: { destination } });
        steps.push({ name: 'waitFor', options: { duration: minutes(15, 60) } });
      }
      else {
        steps.push({ name: 'walkTo', options: { destination } });
        steps.push({ name: 'waitFor', options: { duration: minutes(2, 10) } });
        // steps.push({ name: 'Run away', options: {} });
        const runAwayAgenda: ActivityList = [
          { name: 'Run away', options: {} }];

        if (agent.agenda) {
          const oldAgenda = agent.agenda;
          agent.agenda = [...runAwayAgenda, ...oldAgenda]
        }
        else {
          agent.agenda = [...runAwayAgenda]
        }

      }

      const randomIntVisibility = randomIntInRange(0, 10);
      if (randomIntVisibility <= 3) {
        agent.visibility = 1;
      }
      else {
        agent.visibility = 0;
      }

      agent.speed = 2;
      agent.steps = steps;
      return true;
    },
  },


  'Interrogation': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const steps = [] as ActivityList;
      // agent.reactedTo = 'Drop object';

      if (randomIntInRange(0, 100) < 5) {
        // take the agent to the police station
        // to be added
      }

      steps.push({ name: 'waitFor', options: { duration: minutes(10) } });
      agent.steps = steps;
      return true;
    },
  },

  'Stay at police station': {
    prepare: async (agent: IAgent, _services: IEnvServices, _options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options: { duration: hours(5, 8) } });
      agent.steps = steps;
      return true;
    },
  },

  'Patrol': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
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
      await prepareAgent(agent);
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
      await prepareAgent(agent);
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

  // Maybe also add "spot targets" to pick targets
  'Damage person': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      agent.route = [];
      const steps = [] as ActivityList;

      if (agent.target) {
        damageServices.damageAgent(agent, [agent.target], services)
      }

      steps.push({ name: 'waitFor', options: { duration: minutes(2, 5) } });
      agent.steps = steps;
      return true;
    },
  },

  'Search for problem': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      agent.route = [];
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options });
      agent.steps = steps;

      // not done yet
      // if the attacker is blue, and if the target is hurt, take the agent to the police station
      // if(agent.targets){
      // damageServices.damageAgent(agent,'Attack targets',[services.agents["red2"]],agent.equipment,services)
      // }
      return true;
    },
  },


  'Wander': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
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

  'Wander drone': {
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
      await prepareAgent(agent);
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

  'Release red': {
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
      await prepareAgent(agent);
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
            messageServices.sendMessage(objectAgent, 'Drop bomb', services);
            objectAgent.actual = agent.actual;
            objectAgent.agenda = [{ name: 'Bomb', options: { priority: 1 } }];
          } else if (objectAgent.type === 'gas') {
            messageServices.sendMessage(objectAgent, 'Drop gas', services);
            objectAgent.actual = agent.actual;
            objectAgent.agenda = [{ name: 'Gas', options: { priority: 1 } }];
          } else {
            messageServices.sendMessage(objectAgent, 'Drop object', services);
          }
        }
      }
      steps.push({ name: 'waitFor', options: { duration: 0 } });
      agent.steps = steps;
      return true;
    },
  },

  'Play Message': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const steps = [] as ActivityList;
      agent.visibleForce = 'red';
      // messageServices.sendDamage(agent,'drop object',[services.agents["biker"]],services);
      messageServices.sendMessage(agent, 'Play message', services);
      console.log('play message')
      steps.push({ name: 'waitFor', options: { duration: 0 } });
      agent.steps = steps;
      return true;
    },
  },

  'Check object': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
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
      await prepareAgent(agent);
      const steps = [] as ActivityList;
      const { duration = minutes(1, 10) } = options;
      steps.push({ name: 'waitFor', options: { duration } });
      agent.steps = steps;

      dispatchServices.sendDefence(agent, services);
      return true;
    },
  },

  'Go to other shops': {
    prepare: async (agent: IAgent, _services: IEnvServices, options: IActivityOptions = {}) => {
      await prepareAgent(agent);
      const steps = [] as ActivityList;
      const { actual } = agent;
      const noshops = randomIntInRange(2, 5)
      for (let i = 0; i < noshops; i += 1) {
        const { destination = randomPlaceNearby(agent, 500, 'shop'), duration = minutes(15, 30) } = options;
        agent.destination = destination;
        steps.push({ name: 'walkTo', options: { destination } });
        steps.push({ name: 'waitFor', options: { duration } });
      }
      steps.push({ name: 'walkTo', options: { destination: actual } });
      agent.steps = steps;
      return true;
    },
  },

  'Chaos': {
    prepare: async (agent: IAgent, services: IEnvServices, options: IActivityOptions) => {
      await prepareAgent(agent);
      const steps = [] as ActivityList;
      if (agent.health && agent.health > 30 && agent.equipment && agent.equipment.length > 0) {
        agent.running = true;
        if (options.areaCenter && options.areaRange) {
          const center = options.areaCenter;
          const { destination = randomPlaceInArea(center[0], center[1], options.areaRange, 'any') } = options;
          agent.destination = destination;
          steps.push({ name: 'walkTo', options: { destination } });
        } else {
          const { destination = randomPlaceNearby(agent, 10, 'any') } = options;
          agent.destination = destination;
          steps.push({ name: 'walkTo', options: { destination } });
        }
        messageServices.sendMessage(agent, 'Chaos', services);
        damageServices.damageRandomAgent(agent, services);
        const timesim = services.getTime();
        timesim.setSeconds(timesim.getSeconds() + 6);
        const attackAgenda: ActivityList = [
          { name: 'Chaos', options }];
        if (agent.agenda) {
          const oldAgenda = agent.agenda.filter(item => item.name !== 'Follow person');
          agent.agenda = [...attackAgenda, ...oldAgenda]
        }
        else {
          agent.agenda = [...attackAgenda]
        }
      }

      else if (agent.attire && (agent.attire === 'bomb vest' || agent.attire === 'bulletproof bomb vest')) {
        console.log(agent.id, ' Bomb vest');
        const nearby = await redisServices.geoSearch(agent.actual, 15, agent);
        const nearbyAgents = nearby.map((a: any) => a = services.agents[a.key]);
        const nearbyGroups = nearbyAgents.filter((a: IAgent) => a.group && a.group.length > 0);
        if (nearbyGroups && nearbyGroups.length > 0) {
          const victim = randomItem(nearbyGroups);
          if (victim) {
            agent.running = true;
            steps.push({ name: 'walkTo', options: { destination: victim.actual } });
          }
        } else {
          const victim = randomItem(nearbyAgents);
          if (victim) {
            agent.running = true;
            steps.push({ name: 'walkTo', options: { destination: victim.actual } });
          }
          steps.push({ name: 'explode', options })
        }
      }
      agent.steps = steps;
      return true;
    },
  },

  'Gas': {
    prepare: async (agent: IAgent, _services: IEnvServices, _options: IActivityOptions = {}) => {
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options: { duration: minutes(15, 30) } });
      steps.push({ name: 'disappear', options: {} });
      agent.steps = steps;
      return true;
    },
  },

  'Bomb': {
    prepare: async (agent: IAgent, _services: IEnvServices, _options: IActivityOptions = {}) => {
      const steps = [] as ActivityList;
      steps.push({ name: 'waitFor', options: { duration: minutes(10, 15) } });
      steps.push({ name: 'disappear', options: {} });
      agent.steps = steps;
      return true;
    },
  },

  'Unpanic': {
    prepare: async (agent: IAgent, _services: IEnvServices, _options: IActivityOptions = {}) => {
      const steps = [] as ActivityList;
      delete agent.panic;
      agent.steps = steps;
      return true;
    },
  },

  'Undelay': {
    prepare: async (agent: IAgent, _services: IEnvServices, _options: IActivityOptions = {}) => {
      const steps = [] as ActivityList;
      delete agent.delay;
      agent.steps = steps;
      return true;
    },
  },
}