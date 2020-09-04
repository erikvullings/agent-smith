import { envServices, updateAgent } from './env-services';
import { IAgent } from './models/agent';
import { uuid4, simTime } from './utils';

export const simController = async (
  options: {
    /** Simulation speed. 0 is paused, 1 is real-time. */
    simSpeed?: number;
    startTime?: Date;
  } = {}
) => {
  const { simSpeed = 10, startTime = simTime(0, 6) } = options;
  const services = envServices();
  const agents = [] as IAgent[];

  let currentSpeed = simSpeed;
  let currentTime = startTime;

  const updateTime = () => {
    currentTime = new Date(currentTime.valueOf() + 1000 * currentSpeed);
    services.setTime(currentTime);
  };

  services.locations = {
    huisarts: {
      id: 'doctor',
      coord: [5.490361, 51.457513],
    },
    tue_innovation_forum: {
      id: 'academic',
      coord: [5.486752, 51.446421],
    },
    'Firmamentlaan 5': {
      id: 'home',
      coord: [5.496994, 51.468701],
    },
  };

  agents.push({
    id: uuid4(),
    type: 'man',
    speed: 1.4,
    status: 'walking',
    home: services.locations['Firmamentlaan 5'],
    actual: services.locations['Firmamentlaan 5'],
    occupations: [{ type: 'work', id: 'tue_innovation_forum' }],
  } as IAgent);

  let i = 0;
  while (i < 100000) {
    await Promise.all(agents.filter((a) => a.status).map((a) => updateAgent(a, services)));
    updateTime();
    i++;
  }
};
