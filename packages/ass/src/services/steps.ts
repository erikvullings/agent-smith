import { Profile } from 'osrm-rest-client';
import { IAgent, IActivityOptions } from '../models';
import { IEnvServices } from '../env-services';
import { log } from '../utils';

const moveAgentAlongRoute = (agent: IAgent, deltaTime: number): boolean => {
  const { route = [] } = agent;
  if (route.length > 0) {
    const step = route[0];
    const duration = step.duration || 0;
    if (deltaTime > duration) {
      const first = agent.route?.shift();
      const loc = first?.maneuver?.location;
      if (loc) {
        agent.actual = { id: (first && first.name) || 'unnamed', coord: loc };
      }
      if (route.length > 1) {
        return moveAgentAlongRoute(agent, deltaTime - duration);
      } else {
        // We are moving along the last segment
        agent.destination = undefined;
        agent.route = undefined;
        log(`${agent.id} has reached the final destination: ${agent.actual.id} (${agent.actual.coord}).`);
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
      agent.actual = { id: step.name || 'unnamed', coord };
    }
  }
  log(`${agent.id} has reached ${agent.actual.id} (${agent.actual.coord}).`);
  return false;
};

/** Move the agent along its trajectory */
const moveAgent = (profile: Profile) => async (
  agent: IAgent,
  services: IEnvServices,
  options: IActivityOptions = {}
) => {
  const { route = [], status } = agent;
  if (status === 'paused') return false;
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
  return moveAgentAlongRoute(agent, services.getDeltaTime() / 1000);
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

export const steps = {
  walkTo: moveAgent('foot'),
  cycleTo: moveAgent('bike'),
  driveTo: moveAgent('driving'),
  waitUntil,
  waitFor,
};
