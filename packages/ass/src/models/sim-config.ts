import { IActivityOptions, IStep } from '.';
import { IAgent } from './agent';
import { IDefenseAgent } from './defense-agent';
import { IThreatAgent } from './threat-agent';

export interface ISimConfig {
  settings: Settings;
  customAgents: CustomAgents;
  customAgendas: CustomAgenda[];
}

interface CustomAgents {
  blue: (IAgent & IDefenseAgent)[];
  white: IAgent[];
  red: (IAgent & IThreatAgent)[];
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