import { IOsrmRouteStep } from 'osrm-rest-client';
import { IStepOptions } from '.';

export interface IAgent {
  id: string;
  /** Type of agent */
  type: 'man' | 'woman' | 'boy' | 'girl' | 'car' | string;
  /** Status of the agent */
  status: false | 'paused' | 'walking' | 'cycling' | 'driving' | string;
  /** ID of home address */
  home?: string;
  /** ID of work address */
  occupations?: Array<{
    /** Type of occupation, e.g. work, shop, learn */
    type: string;
    /** Id of the location where the occupation takes place */
    id: string;
  }>;
  /** IDs of relatives and friends */
  relations?: Array<{
    /** Type of relation, e.g. family, relative, friend, enemy */
    type: string;
    /** ID of relation */
    id: string;
  }>;
  /** When the agent is not moving by itself, e.g. is inside a car, or a child travelling with its parents. */
  memberOf?: string;
  /** IDs of the members, e.g. the people inside a car or the children of a parent. */
  group?: string[];
  /** Items that the agent owns, e.g. a car or bicycle. */
  owns?: Array<{
    /** Type of object that the agent owns, e.g. car or bicyle */
    type: string;
    /** ID of the owned object */
    id: string;
  }>;
  /** Actual location as [lon, lat] */
  actual: [number, number];
  /** Name of the active plan, e.g. 'Go to work', 'Go to school', 'Learn', 'Do shopping' */
  plan?: string;
  /** Steps that must be taken to execute the current plan, e.g. go to location, etc. */
  steps?: Array<{ name: string; options?: IStepOptions }>;
  /** Location that agents wants to reach, as [lon, lat] */
  destination?: [number, number];
  /** Speed factor, where 1 is the actual speed suggested by the routing engine */
  speed: number;
  /** Route to follow from actual location to destination */
  route?: IOsrmRouteStep[];
}
