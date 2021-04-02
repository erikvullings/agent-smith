import { AgentType, IAgent, TransportType } from './agent';


export interface IGroup extends IAgent {
  /** Type of group */
  type: AgentType | TransportType;
  /** IDs of members */
  group?: string[];
  /** When the agent is not moving by itself, e.g. is inside a car, or a child travelling with its parents. */
  memberOf?: string;
}