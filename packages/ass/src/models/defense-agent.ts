import { IAgent } from ".";

export interface IDefenseAgent extends IAgent {
  defenseType: 'kmar' | 'police'
  /** work department */
  department?: 'station' | string;
  /** Equpment that the agent carries */
  equipment?: Array<IEquipment>
}

export interface IEquipment {
  /** Type of equipment */
  type: 'firearm' | 'water cannon' | 'baton' | string;
  /** Damage effect that weapon causes */
  damageLevel: 1 | 2 | 3 | number;
}