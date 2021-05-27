import { IActivityOptions, IStep } from '.';
import { IAgent } from './agent';

export interface ISimConfig {
  settings: Settings[];
  customAgents: CustomAgents;
  customAgendas: CustomAgenda[];
  customTypeAgendas: CustomTypeAgenda[];
}

interface CustomAgents {
  blue: (IAgent)[];
  white: IAgent[];
  red: (IAgent)[];
}

export interface CustomAgenda {
  agentId: string;
  startTimeHours?: number;
  startTimeMinutes?: number;
  endTimeFirstPlanHours?: number;
  endTimeFirstPlanMinutes?: number;
  agendaItems: IStep[];
}

export interface CustomTypeAgenda {
  agentType: string;
  agentForce: string;
  startTimeHours?: number;
  startTimeMinutes?: number;
  endTimeFirstPlanHours?: number;
  endTimeFirstPlanMinutes?: number;
  agendaItems: IStep[];
}

export interface AgendaItem {
  name: string;
  options?: IActivityOptions;
}

export interface Settings {
  agentCount: number;
  centerCoord: number[];
  radius: number;
  type?: string;
  object?: string;
  force?: string;
}