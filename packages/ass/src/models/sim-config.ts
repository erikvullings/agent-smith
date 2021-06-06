import { IActivityOptions, IStep } from '.';
import { IAgent } from './agent';
import { ILocation } from './location';

export interface ISimConfig {
  settings: Settings;
  generateSettings: GenerateSettings[];
  locations: { [id: string]: ILocation };
  customAgents: CustomAgents;
  customAgendas: CustomAgenda[];
  customTypeAgendas: CustomTypeAgenda[];
}

interface CustomAgents {
  tbp: IAgent[];
  blue: IAgent[];
  white: IAgent[];
  red: IAgent[];
}

export interface CustomAgenda {
  agentId: string;
  agendaItems: IStep[];
}

export interface CustomTypeAgenda {
  agentType: string;
  agentForce: string;
  agendaItems: IStep[];
}

export interface AgendaItem {
  name: string;
  options?: IActivityOptions;
}

export interface GenerateSettings {
  agentCount: number;
  centerCoord: number[];
  radius: number;
  type?: string;
  object?: string;
  force?: string;
}

export interface Settings {
  startTimeHours?: number;
  startTimeMinutes?: number;
}