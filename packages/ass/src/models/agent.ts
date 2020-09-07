import { IOsrmRouteStep } from 'osrm-rest-client';
import { ActivityList } from '.';
import { ILocation } from './location';

export type TransportType = 'car' | 'bicycle';

export interface IAgent {
  id: string;
  /** Type of agent */
  type: 'man' | 'woman' | 'boy' | 'girl' | TransportType;
  /** Status of the agent */
  status: 'active' | 'walking' | 'cycling' | 'driving';
  /** Actual location as [lon, lat] */
  actual: ILocation;
  /** ID of home address */
  home?: ILocation;
  /** Location that agents wants to reach, as [lon, lat] */
  destination?: ILocation;
  /** ID of work address */
  occupations?: Array<{
    /** Type of occupation, e.g. work, shop, learn */
    type: 'work' | 'shop' | string;
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
    type: TransportType;
    /** ID of the owned object */
    id: string;
  }>;
  /** Agenda day, e.g. in order to create a new agenda each day. Internal property, do not set yourself. */
  _day?: number;
  /** Agenda with active plans, e.g. 'Go to work', 'Work for 4 hours', 'Go to school', 'Learn', 'Do shopping', etc. */
  agenda?: ActivityList;
  /** Steps that must be taken to execute the current plan, e.g. go to location, etc. */
  steps?: ActivityList;
  /** Speed factor, where 1 is the actual speed suggested by the routing engine */
  speed?: number;
  /** Route to follow from actual location to destination */
  route?: IOsrmRouteStep[];
}
