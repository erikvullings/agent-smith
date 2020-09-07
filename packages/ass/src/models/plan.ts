import { IEnvServices } from '../env-services';
import { IAgent } from '.';
import { ILocation } from './location';

export interface IActivityOptions {
  /** Time the activity needs to be start */
  startTime?: Date;
  /** Time the activity needs to be finished */
  endTime?: Date;
  /** Number of microseconds this activity lasts */
  duration?: number;
  /** Destination when travelling */
  destination?: ILocation;
  /** Agents IDs you want to start controlling, e.g. vehicles or children */
  control?: string[];
  /** Agents IDs you are controlling and want to release, e.g. vehicles or children */
  release?: string[];
}

/** A typical step that can be executed. When the step returns true, it signals completion. */
export type Activity = (agent: IAgent, services: IEnvServices, options?: IActivityOptions) => Promise<boolean>;

export type ActivityList = Array<{
  name: string;
  options?: IActivityOptions;
}>;

export interface IPlan {
  /** Prepare the plan, e.g. select a destination and prepare all steps */
  prepare: Activity;
  /** Cleanup when done */
  cleanup?: Activity;
}
