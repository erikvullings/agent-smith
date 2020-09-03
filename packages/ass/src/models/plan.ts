import { IEnvServices } from '../env-services';
import { IAgent } from '.';
import { Coordinate } from 'osrm-rest-client';

export interface IStepOptions {
  destination?: Coordinate;
  [key: string]: any;
}

/** A typical step that can be executed. When the step returns true, it signals completion. */
export type Step = (agent: IAgent, services: IEnvServices, options?: IStepOptions) => Promise<boolean>;

export interface IPlan {
  /** Prepare the plan, e.g. select a destination and prepare all steps */
  prepare?: Step;
  /** Execute each step */
  execute: Step;
  /** Cleanup when done */
  cleanup?: Step;
}
