import { Profile } from 'osrm-rest-client';
import { IAgent, IStepOptions, Step } from '../models';
import { IEnvServices } from '../env-services';
import { log } from '../utils';

const moveAgentAlongRoute = (agent: IAgent, metersToMove: number) => {
  const { route = [] } = agent;
  if (route.length > 0) {
    const step = route[0];
    const distance = step.distance || 0;
    if (metersToMove > distance) {
      const first = agent.route?.shift();
      const loc = first?.maneuver?.location;
      if (loc) {
        agent.actual = loc;
      }
      if (route.length > 1) {
        moveAgentAlongRoute(agent, metersToMove - distance);
        return false;
      } else {
        // agent.status = 'paused';
        // agent.destination = undefined;
        log(`${agent.id} has reached a destination.`);
        return true;
        // We are moving along the last segment
      }
    } else if (step.maneuver) {
      // Move along the current step, i.e. road segment
      const ratio = metersToMove / distance;
      const {
        actual: [x1, y1],
      } = agent;
      const [x2, y2] = step.maneuver.location || [0, 0];
      step.distance = distance - metersToMove;
      agent.actual = [x1 + (x2 - x1) * ratio, y1 + (y2 - y1) * ratio];
    }
  }
  log(`${agent.id} has reached (${agent.actual[0]}, ${agent.actual[1]}).`);
  return false;
};

/** Move the agent along its trajectory */
const moveAgent = (profile: Profile) => async (agent: IAgent, services: IEnvServices, options: IStepOptions = {}) => {
  const { route = [], status } = agent;
  if (status === 'paused') return false;
  const { destination } = options;
  if (route.length === 0) {
    if (!destination) return true;
    const routeService = profile === 'foot' ? services.walk : profile === 'bike' ? services.cycle : services.drive;
    const routeResult = await routeService.route({
      coordinates: [agent.actual, destination],
      continue_straight: true,
      steps: true,
    });
    const legs = routeResult.routes && routeResult.routes.length > 0 && routeResult.routes[0].legs;
    agent.route = legs && legs.length > 0 ? legs[0].steps : undefined;
    log(JSON.stringify(agent.route, null, 2));
  }
  const meters = (agent.speed * services.getDeltaTime()) / 1000;
  return moveAgentAlongRoute(agent, meters);
};

export const steps = {
  walkTo: moveAgent('foot'),
  cycleTo: moveAgent('bike'),
  driveTo: moveAgent('driving'),
} as { [key: string]: Step };
