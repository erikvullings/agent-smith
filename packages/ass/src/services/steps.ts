import { ILineString, Profile } from 'osrm-rest-client';
import { IAgent, IActivityOptions } from '../models';
import { IEnvServices } from '../env-services';

/** Move a group of agents, so compute the new position of one agent, and set the others based on that. */
const moveGroup = (agent: IAgent, services: IEnvServices) => {
  if (!agent.group || agent.group.length === 0) return;
  for (const id of agent.group) {
    const a = services.agents[id];
    if (a) a.actual = agent.actual;
  }
};

const defaultWalkingSpeed = 5000 / 3600;

/** Move agent along a route. */
const moveAgentAlongRoute = (agent: IAgent, services: IEnvServices, deltaTime: number): boolean => {
  const { route = [] } = agent;
  if (route.length === 0) {
    return true; // Done
  }
  const step = route[0];
  const totDistance = step.distance || 0;
  const totDuration = step.duration || 0;
  agent.speed = totDuration > 0 ? totDistance / totDuration : defaultWalkingSpeed;
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
      distance2go -= segmentLength;
    } else {
      i > 0 && (step.geometry as ILineString).coordinates.splice(0, i);
      const ratio = distance2go / segmentLength;
      const coord = [x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio] as [number, number];
      agent.actual = { type: step.name || 'unnamed', coord };
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
  return moveAgentAlongRoute(agent, services, deltaTime - distance2go / agent.speed);
};

/** Move the agent along its trajectory */
const moveAgent = (profile: Profile) => async (
  agent: IAgent,
  services: IEnvServices,
  options: IActivityOptions = {}
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
      // console.log(JSON.stringify(agent.route, null, 2));
    } catch (e) {
      console.error(e);
    }
  }
  return moveAgentAlongRoute(agent, services, services.getDeltaTime() / 1000);
};

/** Wait until a start time before continuing */
const waitUntil = async (_agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  const { startTime } = options;
  return startTime ? startTime < services.getTime() : true;
};

/** Wait for a certain duration before continuing */
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

const releaseAgents = async (agent: IAgent, services: IEnvServices, options: IActivityOptions = {}) => {
  const { release } = options;
  if (agent.group && release && release.length > 0) {
    for (const id of release) {
      const a = services.agents[id];
      const i = agent.group.indexOf(id);
      if (a) {
        a.memberOf = undefined;
        agent.group.splice(i, 1);
      }
    }
  }
  return true;
};

export const steps = {
  walkTo: moveAgent('foot'),
  cycleTo: moveAgent('bike'),
  driveTo: moveAgent('driving'),
  waitUntil,
  waitFor,
  controlAgents,
  releaseAgents,
};
