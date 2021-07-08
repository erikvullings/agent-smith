import { IActivityOptions, IStep } from '.';
import { IAgent, IEquipment } from './agent';
import { ILocation } from './location';

export interface ISimConfig {
  settings: Settings;
  generateSettings: GenerateSettings[];
  locations: { [id: string]: ILocation };
  equipment: { [id: string]: IEquipment };
  hasEquipment: { [id: string]: string[] }
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

export interface Equipment {
  equipmentId: string;
  equipmentProperties: IEquipment;
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
  startCoord?: number[];
  endCoord?: number[];
  radius: number;
  line?: boolean;
  type?: string;
  force?: string;
  object?: string;
  memberCount?: number;
}

export interface Settings {
  startTimeHours?: number;
  startTimeMinutes?: number;
  area?: string;
}