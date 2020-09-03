import { OSRM, Coordinate, IOsrm } from 'osrm-rest-client';
import { plans, steps } from './services';
import { IAgent, IPlan, Step } from './models';

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
  steps: { [step: string]: Step };
  /** Available locations */
  locations: {
    [id: string]: {
      /** Type of location, e.g. office, home, shop */
      type: string;
      /** Coordinate on the map */
      location: Coordinate;
    };
  };
}

/** Create services so an agent can deal with the environment, e.g. for navigation. */
export const envServices = (time: Date = new Date()) => {
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
    /** Available plans */
    plans,
    /** Available steps i.e. basic components that make up a plan, e.g. go to location */
    steps,
    /** Empty object with locations */
    locations: {},
  } as IEnvServices;
};

/** Select a plan from the available plans, and make preparations */
const selectPlan = async (agent: IAgent, services: IEnvServices) => {
  // TODO Make smarter selection
  const plans = Object.keys(services.plans);
  agent.plan = plans[0];
  const plan = services.plans[agent.plan];
  if (plan.prepare) {
    await plan.prepare(agent, services);
  }
  return true;
};

/** Execute a plan */
const executePlan = async (agent: IAgent, services: IEnvServices) => {
  if (agent.plan) {
    const plan = services.plans[agent.plan];
    const ready = await plan.execute(agent, services);
    if (ready) {
      agent.plan = undefined;
    }
    return ready;
  } else {
    return true;
  }
};

export const updateAgent = async (agent: IAgent, services: IEnvServices) => {
  return agent.plan ? executePlan(agent, services) : selectPlan(agent, services);
};
