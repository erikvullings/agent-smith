import { ILineString, Profile, IOsrmRouteResult } from 'osrm-rest-client';
import { IAgent, IActivityOptions, ILocation } from '../models';
import { IEnvServices } from '../env-services';
import { redisServices } from './redis-service';
import { toDate, toTime, generateExistingAgent, addGroup, durationDroneStep, inRangeCheck, determineSpeed, shuffle, randomInRange, randomIntInRange, simTime, minutes, randomPlaceNearby, randomItem } from '../utils';


/**
 * @param {IAgent} agent
 * @param {IEnvServices} services
 * Move a group of agents, so compute the new position of one agent, and set the others based on that.
 */
const moveGroup = (agent: IAgent, services: IEnvServices) => {
  if (!agent.group || agent.group.length === 0) return;
  for (const id of agent.group) {
    const a = services.agents[id];
    if (a) a.actual = agent.actual;
  }
};

/**
 * @param {IAgent} agent
 * @param {IEnvServices} services
 * @param {IAgent[]} agents
 * Release victims from group when in panic
 */
const releaseVictimsGroup = (agent: IAgent, services: IEnvServices, agents: IAgent[]) => {
  let releaseProbabilityPercentage = agent.panic ? agent.panic.panicLevel / 100 : 0;
  if (agent.vulnerability) {
    releaseProbabilityPercentage += (agent.vulnerability / 100);
  }
  const releaseProbability = agent.group ? agent.group.length * 0.01 * releaseProbabilityPercentage : 0;
  const rnd = randomInRange(0, 100);
  if (rnd < releaseProbability) {
    const numberReleased = randomIntInRange(1, 3);
    if (agent.group && agent.group.length >= numberReleased) {
      const agentsToRelease = [...shuffle(agent.group)].slice(0, numberReleased);
      releaseAgents(agent, services, { release: agentsToRelease }, agents);
      for (const a of agentsToRelease) {
        const released = services.agents[a];
        released.health = released.health ? released.health - randomIntInRange(70, 100) : randomIntInRange(0, 30);
        released.health = released.health && released.health > 0 ? released.health : 0;
        released.panic = agent.panic;
        released.delay = agent.delay;
        if (released.agenda) {
          if (released.delay) {
            released.agenda = [{ name: 'Wait', options: { duration: minutes(1, 3) } }, { name: 'Go to specific location', options: { destination: agent.destination } }, { name: 'Undelay', options: {} }, { name: 'Wait', options: { duration: minutes(10) } }, { name: 'Unpanic', options: {} }, ...released.agenda];
          } else {
            released.agenda = [{ name: 'Wait', options: { duration: minutes(1, 3) } }, { name: 'Go to specific location', options: { destination: agent.destination } }, { name: 'Undelay', options: {} }, { name: 'Wait', options: { duration: minutes(10) } }, { name: 'Unpanic', options: {} }, ...released.agenda];
          }
        } else if (released.delay) {
          released.agenda = [{ name: 'Wait', options: { duration: minutes(1, 3) } }, { name: 'Go to specific location', options: { destination: agent.destination } }, { name: 'Wait', options: { duration: minutes(10) } }, { name: 'Go home', options: {} }];
        } else {
          released.agenda = [{ name: 'Wait', options: { duration: minutes(1, 3) } }, { name: 'Go to specific location', options: { destination: agent.destination } }, { name: 'Wait', options: { duration: minutes(10) } }, { name: 'Go home', options: {} }];
        }
        released.running = true;
        if (released.health === 0) {
          released.status = 'inactive';
        }
      }
    }
  }
}



/**
 * @param {IAgent} agent
 * @param {IEnvServices} services
 * @param {number} deltaTime
 * @param {IAgent[]} agents
 * Move agent along a route.
 */
const moveAgentAlongRoute = (agent: IAgent, services: IEnvServices, deltaTime: number, agents: IAgent[]): boolean => {
  const { route = [] } = agent;
  if (route.length === 0) {
    return true; // Done
  }
  const step = route[0];
  const totDistance = step.distance || 0;
  const totDuration = step.duration || 0;
  if (agent.type === 'group' && agent.force === 'blue') {
    agent.speed = 3;
  }
  else {
    agent.speed = determineSpeed(agent, services, totDistance, totDuration);
  }
  let distance2go = agent.speed * deltaTime;
  const waypoints = (step.geometry as ILineString).coordinates;
  for (let i = 0; i < waypoints.length; i++) {
    const [x0, y0] = agent.actual.coord;
    const [x1, y1] = waypoints[i];
    const segmentLength = services.distance(x0, y0, x1, y1);
    if (distance2go >= segmentLength) {
      agent.actual = { type: step.name || 'unnamed', coord: [x1, y1] };
      // redisServices.geoAdd('agents', agent);
      distance2go -= segmentLength;
      agent.route = route;
      if (agent.type === 'group' && agent.group && agent.group.length > 0) {
        if (agent.panic && agent.panic.panicLevel > 0 && agent.running) {
          releaseVictimsGroup(agent, services, agents);
        }
      }
    } else {
      if (i > 0) {
        (step.geometry as ILineString).coordinates.splice(0, i);
      }
      const ratio = distance2go / segmentLength;
      const coord = [x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio] as [number, number];
      agent.actual = { type: step.name || 'unnamed', coord };
      redisServices.geoAdd('agents', agent);
      moveGroup(agent, services);
      // console.log(
      //   `${agent.id} is travelling at ${Math.round((agent.speed * 36) / 10)}km/h to ${agent.actual.type} (${round(
      //     agent.actual.coord
      //   )}).`
      // );
      return false;
    }
  }
  route.splice(0, 1);
  return moveAgentAlongRoute(agent, services, deltaTime - distance2go / agent.speed, agents);

};

/**
 * @param {IAgent} agent
 * @param {IEnvServices} services
 * @param {number} deltaTime
 * @param {IAgent[]} agents
 * Move agent fleeing along a route.
 */
const fleeAgentAlongRoute = async (agent: IAgent, services: IEnvServices, deltaTime: number, agents: IAgent[]): Promise<boolean> => {
  const { route = [] } = agent;
  if (route.length === 0) {
    return true; // Done
  }
  const step = route[0];
  const totDistance = step.distance || 0;
  const totDuration = step.duration || 0;
  if (agent.type === 'group' && agent.force === 'blue') {
    agent.speed = 3;
  }
  else {
    agent.speed = determineSpeed(agent, services, totDistance, totDuration);
  }
  let distance2go = agent.speed * deltaTime;
  const waypoints = (step.geometry as ILineString).coordinates;
  for (let i = 0; i < waypoints.length; i++) {
    const [x0, y0] = agent.actual.coord;
    const [x1, y1] = waypoints[i];
    const segmentLength = services.distance(x0, y0, x1, y1);
    // const segmentLength2 = distance([y0, x0], [y1, x1], { units: 'meters' });
    // console.log(`${Math.abs(segmentLength2 - segmentLength)}`);
    if (distance2go >= segmentLength) {
      agent.actual = { type: step.name || 'unnamed', coord: [x1, y1] };
      // redisServices.geoAdd('agents', agent);
      distance2go -= segmentLength;
      agent.route = route;
      try {
        const inRange = await redisServices.geoSearch(agent.actual, 5, agent);
        const agentsInRange = inRange.map((a: any) => a = services.agents[a.key]);
        const whiteGroups = agentsInRange.filter((a: IAgent) => a.type === 'group' && a.force === 'white');
        const group = randomItem(whiteGroups);
        if (group && group.group && group.group.length > 0 && agent.speed && agent.speed > 0) {
          if (group.group && group.memberCount) {
            group.group.push(agent.id);
            group.memberCount += 1;
            addGroup(agent, group, services);
          } else {
            group.group = [agent.id];
            group.memberCount = 1;
            addGroup(agent, group, services);
          }
          agent.actual = group.actual;
          agent.memberOf = group.id;
          return false
        }
        if (agentsInRange && agentsInRange.length > 0) {
          const collideProb = 0.3;
          const r = randomInRange(0, 1);
          if (r < collideProb) {
            agent.health = agent.health ? agent.health - randomIntInRange(0, 15) : randomIntInRange(100, 85);
            if (agent.steps) {
              agent.steps = [{ name: 'waitFor', options: { duration: 0 } }, { name: 'waitFor', options: { duration: minutes(3) } }, ...agent.steps];
            } else {
              agent.steps = [{ name: 'waitFor', options: { duration: 0 } }, { name: 'waitFor', options: { duration: minutes(3) } }];
            }
            return false
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      if (i > 0) {
        (step.geometry as ILineString).coordinates.splice(0, i);
      }
      const ratio = distance2go / segmentLength;
      const coord = [x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio] as [number, number];
      agent.actual = { type: step.name || 'unnamed', coord };
      redisServices.geoAdd('agents', agent);
      moveGroup(agent, services);
      // console.log(
      //   `${agent.id} is travelling at ${Math.round((agent.speed * 36) / 10)}km/h to ${agent.actual.type} (${round(
      //     agent.actual.coord
      //   )}).`
      // );
      return false;
    }
  }
  route.splice(0, 1);
  return fleeAgentAlongRoute(agent, services, deltaTime - distance2go / agent.speed, agents);

};

/**
 * @param {Profile} profile
 * Move the agent along its trajectory
 */
const moveAgent = (profile: Profile) => async (
  agent: IAgent,
  services: IEnvServices,
  options: IActivityOptions = {},
  agents: IAgent[]
) => {
  const { route = [], memberOf } = agent;
  if (memberOf) return false; // TODO Or can we return true?
  const { destination } = options;
  if (route.length === 0) {
    if (!destination) return true;
    try {
      const routeService = profile === 'foot' ? services.walk : profile === 'bike' ? services.cycle : services.drive;
      const routeResult = await routeService.route({
        coordinates: [agent.actual.coord, destination.coord],
        continue_straight: true,
        steps: true,
        overview: 'full',
        geometries: 'geojson',
      });
      const legs = routeResult.routes && routeResult.routes.length > 0 && routeResult.routes[0].legs;
      agent.route = legs && legs.length > 0 ? legs[0].steps : undefined;
    } catch (e) {
      console.error(e);
    }
  }
  if (agent.panic && agent.panic.panicLevel > 0 && agent.running && (agent.type === 'man' || agent.type === 'woman' || agent.type === 'boy' || agent.type === 'girl')) {
    try {
      const flee = await fleeAgentAlongRoute(agent, services, services.getDeltaTime() / 1000, agents);
      return flee
    } catch (e) {
      console.error(e);
    }
  }
  return moveAgentAlongRoute(agent, services, services.getDeltaTime() / 1000, agents);
};


const flyTo = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}, agents: IAgent[]) => {
  const { route = [], memberOf } = agent;
  const { distance } = services;
  if (memberOf) return false;
  const { destination } = options;
  if (route.length === 0) {
    if (!destination) return true;
    try {
      const distanceToDestination = distance(agent.actual.coord[0], agent.actual.coord[1], destination.coord[0], destination.coord[1]);
      const duration = durationDroneStep(agent.actual.coord[0], agent.actual.coord[1], destination.coord[0], destination.coord[1]);
      route.push({ distance: distanceToDestination, duration, geometry: { coordinates: [[destination.coord[0], destination.coord[1]]], type: 'LineString' } });
      agent.route = route;
    } catch (e) {
      console.error(e);
    }
  }
  return moveAgentAlongRoute(agent, services, services.getDeltaTime() / 1000, agents);
};

/**
 * @param {IAgent} agent
 * @param {IEnvServices} services
 * @param {IActivityOptions} options
 * Wait until a start time before continuing
 */
const waitUntil = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {

  const { startTime } = options;
  if (startTime) {
    const startTimeDate = toDate(agent, services, startTime);
    if (startTime[startTime.length - 1] === 'r') {
      options.startTime = toTime(startTimeDate?.getHours(), startTimeDate?.getMinutes(), startTimeDate?.getSeconds())
    }
    return startTimeDate ? startTimeDate < services.getTime() : true;
  }
  return true;
};


/**
 * @param {IAgent} agent
 * @param {IEnvServices} services
 * @param {IActivityOptions} options
 * Wait for a certain duration before continuing
 */
const waitFor = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  const { duration = 0 } = options;
  if (duration === 0) {
    return true;
  }
  const startTimeDate = new Date(services.getTime().valueOf() + duration);
  const startTime = toTime(startTimeDate.getHours(), startTimeDate.getMinutes(), startTimeDate.getSeconds());
  const stepOptions = { startTime };
  if (agent.steps) {
    // Replace active 'waitFor' step with 'waitUntil' step.
    agent.steps[0] = { name: 'waitUntil', options: stepOptions };
  }
  return waitUntil(agent, services, stepOptions);
};

const controlAgents = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  const { control } = options;
  if (control && control.length > 0) {
    if (!agent.group) {
      agent.group = [];
    }
    for (const id of control) {
      const a = services.agents[id];
      if (a) {
        a.memberOf = agent.id;
        agent.group.push(id);
        if (agent.memberCount) {
          agent.memberCount += 1;
        } else {
          agent.memberCount = 1;
        }
      }
    }
  }
  return true;
};

/**
 * Release agents from group
 *
 * @param {IAgent} agent
 * @param {IEnvServices} services
 * @param {IActivityOptions} options
 * @param {IAgent[]} agents
 */
const releaseAgents = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}, agents: IAgent[]) => {
  const { release } = options;
  if (agent.group && agent.memberCount && release && release.length > 0) {
    for (const id of release) {
      const i = agent.group.indexOf(id);
      let a: IAgent;
      if (id in services.agents) {
        a = services.agents[id];

        if (a && i > -1) {
          delete a.memberOf;
          agent.group.splice(i, 1);
          agent.memberCount -= 1;

          if (a.type === 'car' || a.type === 'bicycle') {
            delete a.group;
          }

          if (a.group) {
            releaseAgents(agent, services, { release: a.group }, agents);
            for (const member of a.group) {
              if (agent.steps) {
                agent.steps = [{ name: 'joinGroup', options: { group: a.id } }, ...agent.steps];
              } else {
                agent.steps = [{ name: 'joinGroup', options: { group: a.id } }];
              }
            }
          }
        }
      } else {
        const newAgent = generateExistingAgent(agent.actual.coord[0], agent.actual.coord[1], 100, id, agent, 'man');
        a = newAgent.agent;
        agents.push(a);
        redisServices.geoAdd('agents', a);
        services.agents[id] = a;

        if (a && i > -1) {
          delete a.memberOf;
          agent.group.splice(i, 1);
          agent.memberCount -= 1;
          if (a.type === 'car' || a.type === 'bicycle') {
            delete a.group;
          }
        }
      }
    }
  }
  if (agent.type === 'group' && (!agent.group || agent.group.length < 1)) {
    agent.status = 'inactive';
  }
  return true;
};


const stopRunning = async (agent: IAgent, _services: IEnvServices, _options: IActivityOptions = {}) => {
  if (agent.running) {
    delete agent.running;
  }
  return true;
};

/**
 * @param agent
 * @param services
 * @param options
 * @returns
 * If the group is within 10 meters, the agent joins the given group
 */
const joinGroup = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  const { group } = options;
  const inRange = await redisServices.geoSearch(agent.actual, 10, agent);
  const agentsInRange = inRange.map((a: any) => a = services.agents[a.key]);
  if (group) {
    const newGroup = services.agents[group];
    if (agentsInRange.indexOf(newGroup) > -1) {
      if (newGroup.group && newGroup.memberCount) {
        if (newGroup.group.indexOf(agent.id) < 0) {
          newGroup.group.push(agent.id);
          newGroup.memberCount += 1;
          addGroup(agent, newGroup, services);
        }
      } else {
        newGroup.group = [agent.id];
        newGroup.memberCount = 1;
        addGroup(agent, newGroup, services);
      }
      agent.actual = newGroup.actual;
      agent.memberOf = newGroup.id;
    }
  }
  return true;
};

const disappear = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  agent.memberOf = 'invisible';
  agent.status = 'inactive';
  return true;
};

const explode = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  const deathRange = await redisServices.geoSearch(agent.actual, 5, agent);
  const agentsInDeathRange = deathRange.map((a: any) => a = services.agents[a.key]);
  agentsInDeathRange.map((a: IAgent) => a.health = 0)
  const damageRange = await redisServices.geoSearch(agent.actual, 15, agent);
  const receivers = damageRange.map((a: any) => a = services.agents[a.key]);
  if (receivers) {
    if (receivers.length > 0) {
      receivers.filter((a: IAgent) => a.health && a.health > 0 && a.attire && (a.attire === 'bulletproof vest' || a.attire === 'bulletproof bomb vest')).map((a: IAgent) => (a.health! -= 5 * randomIntInRange(0, 10)));
      receivers.filter((a: IAgent) => a.health && a.health > 0 && !a.attire).map((a: IAgent) => (a.health! -= 5 * randomIntInRange(10, 20)))
      receivers.filter((a: IAgent) => !a.health || a.health < 0).map((a: IAgent) => a.health = 0);
    }
    const deadAgents = receivers.filter((a: IAgent) => a.health && a.health <= 0)
    deadAgents.push(agent);
    if (deadAgents.length > 0) {
      deadAgents.map((a: IAgent) => (a.agenda = []) && (a.route = []) && (a.steps = []) && (a.status = 'inactive'))
    }
    agent.health = 0;
  }
  return true;
};

export const steps = {
  walkTo: moveAgent('foot'),
  cycleTo: moveAgent('bike'),
  driveTo: moveAgent('driving'),
  flyTo,
  waitUntil,
  waitFor,
  controlAgents,
  releaseAgents,
  stopRunning,
  joinGroup,
  disappear,
  explode,
};
