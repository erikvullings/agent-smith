import { IAgent } from "./agent";

export interface ISimConfig {
  settings: Settings;
  customAgents: IAgent[];
  customAgendas: CustomAgenda[];
}

export interface CustomAgenda {
  agentIds: string[];
  agendaItems: AgendaItem[];
}

export interface AgendaItem {
  name: string;
  options?: Options;
}

export interface Options {
  simTime?: Date;  
}

export interface Home {
  type: string;
  coord: number[];
}

export interface Own {
  type: string;
  id: string;
}

export interface Settings {
  agentCount: number;
  center_coord: number[];
  radius: number;
}