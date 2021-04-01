import { IOsrmRouteStep } from 'osrm-rest-client';
import { ActivityList } from '.';
import { ILocation } from './location';

export type TransportTypeGroup = 'car' | 'bus' | 'train';

export interface IGroup {
  id: string;
  /** Type of group */
  type: 'group' | TransportTypeGroup;
  /** Status of the group */
  status: 'active' | 'walking' | 'driving';
  /** Actual location as [lon, lat] */
  actual: ILocation;
  /** Location that agents wants to reach, as [lon, lat] */
  destination?: ILocation;
  /** Force of the agent (white, red or blue) */
  force?: 'white'|'red'|'blue';
  /** number of members in the group */
  nomembers?: number;
  /** IDs of members */
  group?: string[];
  /** When the agent is not moving by itself, e.g. is inside a car, or a child travelling with its parents. */
  memberOf?: string;
  /** Agenda day, e.g. in order to create a new agenda each day. Internal property, do not set yourself. */
  _day?: number;
  occupations?: Array<{
    /** Type of occupation, e.g. work, shop, learn */
    type: 'work' | 'shop' | 'wander' | 'doctor_visit' | string;
    /** Id of the location where the occupation takes place */
    id: string;
  }>;
  /** home of group */
  home?: ILocation;
  /** Agenda with active plans, e.g. 'Go to work', 'Work for 4 hours', 'Go to school', 'Learn', 'Do shopping', etc. */
  agenda?: ActivityList;
  /** Steps that must be taken to execute the current plan, e.g. go to location, etc. */
  steps?: ActivityList;
  /** Speed factor, where 1 is the actual speed suggested by the routing engine */
  speed?: number;
  /** Route to follow from actual location to destination */
  route?: IOsrmRouteStep[];
}