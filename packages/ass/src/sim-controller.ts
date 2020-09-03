import { envServices, updateAgent } from './env-services';
import { IAgent } from './models/agent';
import { uuid4, log } from './utils';

export const simController = async (
  options: {
    /** Simulation speed. 0 is paused, 1 is real-time. */
    simSpeed?: number;
    startTime?: Date;
  } = {}
) => {
  const { simSpeed = 10, startTime = new Date() } = options;
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
      type: 'doctor',
      location: [5.490361, 51.457513],
    },
    tue_innovation_forum: {
      type: 'academic',
      location: [5.486752, 51.446421],
    },
  };

  agents.push({
    id: uuid4(),
    type: 'man',
    speed: 1.4,
    status: 'walking',
    home: 'Firmamentlaan 5',
    actual: [5.496994, 51.468701],
    destination: [5.479583, 51.443029],
    occupations: [{ type: 'work', id: 'tue_innovation_forum' }],
  } as IAgent);

  let i = 0;
  while (i < 100000) {
    await Promise.all(agents.filter((a) => a.status).map((a) => updateAgent(a, services)));
    updateTime();
    i++;
  }
};
