import { Profile } from 'osrm-rest-client';
import { IAgent, IActivityOptions } from '../models';
import { IEnvServices } from '../env-services';
import { log } from '../utils';

/** Move a group of agents, so compute the new position of one agent, and set the others based on that. */
const moveGroup = (agent: IAgent, services: IEnvServices) => {
  if (!agent.group || agent.group.length === 0) return;
  for (const id of agent.group) {
    const a = services.agents[id];
    if (a) a.actual = agent.actual;
  }
};

/** Move agent along a route. */
const moveAgentAlongRoute = (agent: IAgent, services: IEnvServices, deltaTime: number): boolean => {
  const { route = [] } = agent;
  if (route.length > 0) {
    const step = route[0];
    const duration = step.duration || 0;
    if (deltaTime > duration) {
      const first = agent.route?.shift();
      const loc = first?.maneuver?.location;
      if (loc) {
        agent.actual = { type: (first && first.name) || 'unnamed', coord: loc };
        moveGroup(agent, services);
      }
      if (route.length > 1) {
        return moveAgentAlongRoute(agent, services, deltaTime - duration);
      } else {
        // We are moving along the last segment
        agent.destination = undefined;
        agent.route = undefined;
        log(`${agent.id} has reached the final destination: ${agent.actual.type} (${agent.actual.coord}).`);
        return true;
      }
    } else if (step.maneuver) {
      // Move along the current step, i.e. road segment
      const ratio = deltaTime / duration;
      const {
        actual: {
          coord: [x1, y1],
        },
      } = agent;
      const [x2, y2] = step.maneuver.location || [0, 0];
      step.duration = duration - deltaTime;
      const coord = [x1 + (x2 - x1) * ratio, y1 + (y2 - y1) * ratio] as [number, number];
      agent.actual = { type: step.name || 'unnamed', coord };
      moveGroup(agent, services);
    }
  }
  log(`${agent.id} has reached ${agent.actual.type} (${agent.actual.coord}).`);
  return false;
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
    const routeService = profile === 'foot' ? services.walk : profile === 'bike' ? services.cycle : services.drive;
    const routeResult = await routeService.route({
      coordinates: [agent.actual.coord, destination.coord],
      continue_straight: true,
      steps: true,
    });
    const legs = routeResult.routes && routeResult.routes.length > 0 && routeResult.routes[0].legs;
    agent.route = legs && legs.length > 0 ? legs[0].steps : undefined;
    log(JSON.stringify(agent.route, null, 2));
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
