import { IActivityOptions, IStep } from ".";
import { IAgent } from "./agent";
import { IDefenseAgent } from "./defense-agent";

export interface ISimConfig {
  settings: Settings;
  customAgents: CustomAgents;
  customAgendas: CustomAgenda[];
}

interface CustomAgents {
  blue: Array<IAgent & IDefenseAgent>;
  white: Array<IAgent>;
  red: Array<IAgent>;
}

export interface CustomAgenda {
  agentId: string;
  agendaItems: Array<IStep>;
}

export interface AgendaItem {
  name: string;
  options?: IActivityOptions;
}

export interface Settings {
  agentCount: number;
  center_coord: number[];
  radius: number;
}