import { ILineString, Profile, IOsrmRouteResult } from 'osrm-rest-client';
import { IAgent, IActivityOptions, ILocation } from '../models';
import { IEnvServices } from '../env-services';
import { redisServices } from './redis-service';
import { generateExistingAgent, addGroup, durationDroneStep, inRangeCheck, determineSpeed, round, shuffle, randomInRange } from '../utils';


/**
 * @param agent
 * @param services
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
 * @param agent
 * @param services
 * @param agents
 * release victims from group when in panic
 */
const releaseVictimsGroup = (agent: IAgent, services: IEnvServices, agents: IAgent[]) => {
  let percentageReleased = agent.panicLevel ? agent.panicLevel / 2000 : 0;
  if (agent.vulnerability) {
    percentageReleased += (agent.vulnerability / 2000);
  }
  const numberReleased = round(agent.memberCount * 0.01 * percentageReleased, 0);
  console.log(numberReleased);
  if (agent.group && agent.group.length >= numberReleased) {
    const agentsToRelease = [...shuffle(agent.group)].slice(0, numberReleased);
    releaseAgents(agent, services, { release: agentsToRelease }, agents);
    for (const a of agentsToRelease) {
      const released = services.agents[a];
      released.health = randomInRange(0, 20);
      if (released.health === 0) {
        released.status = 'inactive';
      }

    }
  }
}

/**
 * @param agent
 * @param services
 * @param deltaTime
 * @param agents
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
  agent.speed = determineSpeed(agent, services, totDistance, totDuration);
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
  agent.route = route;
  if (agent.type === 'group' && agent.group && agent.group.length > 0) {
    if (agent.panicLevel) {
      releaseVictimsGroup(agent, services, agents);
    }
  }
  return moveAgentAlongRoute(agent, services, deltaTime - distance2go / agent.speed, agents);
};

/**
 * @param profile
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
      // console.log(agent.route)
      // console.log(JSON.stringify(agent.route, null, 2));
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
 * @param _agent
 * @param services
 * @param options
 * Wait until a start time before continuing
 */
const waitUntil = async (_agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  const { startTime } = options;
  return startTime ? startTime < services.getTime() : true;
};

/**
 * @param agent
 * @param services
 * Wait until a start time before continuing
 */
const waitUntilList = async (agent: IAgent, services: IEnvServices) => {
  const { startTime } = agent;
  return startTime ? startTime < services.getTime() : true;
};

/**
 * @param agent
 * @param services
 * @param options
 * Wait for a certain duration before continuing
 */
const waitFor = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  const { duration = 0 } = options;
  if (duration === 0) {
    return true;
  }
  const stepOptions = { startTime: new Date(services.getTime().valueOf() + duration) };
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
      }
    }
  }
  return true;
};

/**
 * Release agents from group
 *
 * @param agent
 * @param services
 * @param options
 * @param agents
 */
const releaseAgents = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}, agents?: IAgent[]) => {
  const { release } = options;
  if (agent.group && agent.memberCount && release && release.length > 0) {
    for (const id of release) {
      let a: IAgent;
      if (id in services.agents) {
        a = services.agents[id];
      } else {
        const newAgent = generateExistingAgent(agent.actual.coord[0], agent.actual.coord[1], 100, id, agent, 'man');
        a = newAgent.agent;
        agents.push(a);
        services.agents[id] = a;
      }
      const i = agent.group.indexOf(id);
      if (a) {
        delete a.memberOf;
        agent.group.splice(i, 1);
        agent.memberCount -= 1;
        if (a.type === 'car' || a.type === 'bicycle') {
          delete a.group;
        }
      }
    }
  }
  return true;
};


const stopRunning = async (agent: IAgent, _services: IEnvServices, _options: IActivityOptions = {}) => {
  if (agent.running) {
    delete agent.running;
  }
  return true;
};

const joinGroup = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  const { group } = options;
  if (group) {
    const newGroup = services.agents[group];
    if (newGroup.group && newGroup.memberCount) {
      newGroup.group.push(agent.id);
      newGroup.memberCount.push(agent.id);
      addGroup(agent, newGroup, services);
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


export const steps = {
  walkTo: moveAgent('foot'),
  cycleTo: moveAgent('bike'),
  driveTo: moveAgent('driving'),
  flyTo,
  waitUntil,
  waitUntilList,
  waitFor,
  controlAgents,
  releaseAgents,
  stopRunning,
  joinGroup,
  disappear,
};
