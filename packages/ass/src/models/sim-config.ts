import { IActivityOptions, IStep } from '.';
import { IAgent } from './agent';
import { IDefenseAgent } from './defense-agent';

export interface ISimConfig {
  settings: Settings;
  customAgents: CustomAgents;
  customAgendas: CustomAgenda[];
}

interface CustomAgents {
  blue: (IAgent & IDefenseAgent)[];
  white: IAgent[];
  red: IAgent[];
}

export interface CustomAgenda {
  agentId: string;
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
}