import { IEnvServices } from '../env-services';
import { IAgent } from '.';
import { ILocation } from './location';

export interface IActivityOptions {
  /** Time the activity needs to be start */
  startTime?: string;
  /** Time the activity needs to be finished */
  endTime?: string;
  /** Number of microseconds this activity lasts */
  duration?: number;
  /** Destination when travelling */
  destination?: ILocation;

  destination2?: Record<number, ILocation>;
  /** Center of area when travelling inside specific area */
  areaCenter?: [number, number];
  /** Radius of area when travelling inside specific area in meters*/
  areaRadius?: number;
  /** Agents IDs you want to start controlling, e.g. vehicles or children */
  control?: string[];
  /** Agents IDs you are controlling and want to release, e.g. vehicles or children */
  release?: string[];
  /** ID of group you want to join */
  group?: string;
  /** Priority of activity */
  priority?: 1 | 2 | 3 | 4 | 5;
  /** Is the agent reacting */
  reacting?: boolean;
  /** Targets of the action */
  targets?: IAgent[];
}

export type IAgentActivities = IAgentActivity[];

export interface IAgentActivity {
  [key: string]: ActivityList[];
}

/** A typical step that can be executed. When the step returns true, it signals completion. */
export type Activity = (
  agent: IAgent,
  services: IEnvServices,
  options?: IActivityOptions,
  agents?: IAgent[]
) => Promise<boolean>;

export type ActivityList = IStep[];

export interface IStep {
  name: string;
  options?: IActivityOptions;
}

export interface IPlan {
  /** Prepare the plan, e.g. select a destination and prepare all steps */
  prepare: Activity;
  /** Cleanup when done */
  cleanup?: Activity;
}
