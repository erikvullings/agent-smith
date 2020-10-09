import { OSRM, IOsrm } from 'osrm-rest-client';
import { plans, steps } from './services';
import { IAgent, IPlan, Activity, IActivityOptions, ILocation } from './models';
import { simTime, hours, randomInRange, simplifiedDistanceFactory } from './utils';

export interface IEnvServices {
  /** Get sim time */
  setTime: (time: Date) => void;
  /** Actual sim time */
  getTime: () => Date;
  /** Delta t in msec */
  getDeltaTime: () => number;
  drive: IOsrm;
  cycle: IOsrm;
  walk: IOsrm;
  /** Agent lookup */
  agents: { [id: string]: IAgent };
  /** Available plans */
  plans: { [plan: string]: IPlan };
  /** Available steps i.e. basic components that make up a plan, e.g. go to location */
  steps: { [step: string]: Activity };
  /** Available locations */
  locations: { [id: string]: ILocation };
  /** Approximate distance calculator in meters */
  distance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
}

/** Create services so an agent can deal with the environment, e.g. for navigation. */
export const envServices = ({
  time = new Date(),
}: {
  time?: Date /** See bounding boxes of all countries: https://gist.github.com/graydon/11198540 */;
  latitudeAvg?: number;
} = {}) => {
  const drive = OSRM({ osrm: 'http://127.0.0.1:5000', defaultProfile: 'driving' });
  const cycle = OSRM({ osrm: 'http://127.0.0.1:5001', defaultProfile: 'bike' });
  const walk = OSRM({ osrm: 'http://127.0.0.1:5002', defaultProfile: 'foot' });

  let deltaTime = 0;
  let currentTime = time;

  const setTime = (time: Date) => {
    deltaTime = time.valueOf() - currentTime.valueOf();
    currentTime = time;
  };

  const getTime = () => currentTime;

  const getDeltaTime = () => deltaTime;

  return {
    setTime,
    getTime,
    getDeltaTime,
    /** Routing service for driving a car */
    drive,
    /** Routing service for cycling */
    cycle,
    /** Routing service for walking */
    walk,
    /** Agent lookup */
    agents: {},
    /** Available high-level plans for agents to choose from */
    plans,
    /** Available steps i.e. basic activities that make up a plan, e.g. go to location */
    steps,
    /** Empty object with locations */
    locations: {},
    /** Approximate distance function in meters */
    distance: simplifiedDistanceFactory(),
  } as IEnvServices;
};

const createAgenda = (agent: IAgent, _services: IEnvServices) => {
  if (typeof agent._day === 'undefined') {
    agent._day = 0;
  } else {
    agent._day++;
  }
  const { _day: day } = agent;

  agent.agenda = [
    { name: 'Go to work', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
    { name: 'Work', options: { duration: hours(3, 5) } },
    { name: 'Have lunch' },
    { name: 'Work', options: { duration: hours(3, 5) } },
    { name: 'Go home' },
  ];
};

export const executeSteps = async (
  agent: IAgent & { steps: Array<{ name: string; options?: IActivityOptions }> },
  services: IEnvServices
) => {
  const { name, options } = agent.steps[0];
  const step = services.steps[name];
  if (step && (await step(agent, services, options))) {
    // Task completed: remove
    agent.steps.shift();
  }
  return agent.steps.length === 0;
};

export const updateAgent = async (agent: IAgent, services: IEnvServices) => {
  if (agent.steps && agent.steps.length > 0) {
    const result = await executeSteps(
      agent as IAgent & { steps: Array<{ name: string; options?: IActivityOptions }> },
      services
    );
    if (result) {
      const curPlan = agent.agenda?.shift();
      if (curPlan) {
        const { name, options } = curPlan;
        const plan = services.plans[name];
        if (plan && plan.cleanup) {
          await plan.cleanup(agent, services, options);
        }
      }
    }
  } else if (agent.agenda && agent.agenda.length > 0) {
    const { name, options } = agent.agenda[0];
    const plan = services.plans[name];
    if (plan && plan.prepare) {
      await plan.prepare(agent, services, options);
    }
  } else {
    createAgenda(agent, services);
    updateAgent(agent, services);
  }
};
