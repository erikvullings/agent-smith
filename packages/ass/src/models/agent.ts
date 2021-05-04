import { IOsrmRouteStep } from 'osrm-rest-client';
import { ActivityList } from '.';
import { ILocation } from './location';

export type TransportType = 'car' | 'bicycle' | 'bus' | 'train';
export type AgentType = 'man' | 'woman' | 'boy' | 'girl' | 'group' ;
export type ObjectType = 'object' ;

export interface IAgent {
   /** When the agent is not moving by itself, e.g. is inside a car, or a child travelling with its parents. */ /** When the agent is not moving by itself, e.g. is inside a car, or a child travelling with its parents. */ 
  id: string;
  /** Type of agent */
  type: AgentType | TransportType | ObjectType;
  /** Status of the agent */
  status: 'active' | 'walking' | 'cycling' | 'driving';
  /** Actual location as [lon, lat] */
  actual: ILocation;
  /** Force of the agent (white, red or blue) */
  force: 'white'|'red'|'blue';
  /** ID of home address */
  home?: ILocation;
  /** Location that agents wants to reach, as [lon, lat] */
  destination?: ILocation;
  /** ID of work address */
  occupations?: Array<{
    /** Type of occupation, e.g. work, shop, learn */
    type: 'work' | 'learn' | string;
    /** Id of the location where the occupation takes place */
    id: string;
  }>;
  /** ID of task address */
  activities?: Array<{
    /** Type of occupation, e.g. work, shop, learn */
    type: 'work' | 'learn' | 'shop' | 'wander' | 'doctor_visit' | string;
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
  /** IDs of the members that do not have type "group" */
  membercount?: string[];
  /** Items that the agent owns, e.g. a car or bicycle. */
  owns?: Array<{
    /** Type of object that the agent owns, e.g. car or bicyle */
    type: TransportType;
    /** ID of the owned object */
    id: string;
  }>;
  /** Equal to 1 or empty if agent is visibile, equal to 0 if agent is invisible */
  visibility?: number;
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
  /** Mailbox for messages */
  mailbox: Array<IMail>;
  sentbox: Array<{receiver: IAgent, mail: IMail}>;
}

export interface IMail {
    /** Id of the sender */
    sender: IAgent;
    /** Location of the sender */
    location: ILocation;
    /** Message of the sender */
    message: string;
} 
