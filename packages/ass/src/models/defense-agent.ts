import { IAgent } from '.';

export interface IDefenseAgent extends IAgent {
  defenseType: 'kmar' | 'police'
  /** work department */
  department: 'station' | string;
  /** Equpment that the agent carries */
  equipment?: IEquipment[],
  /** Equpment that is in use */
  currentEquipment?: IEquipment

}

export interface IEquipment {
  /** Type of equipment */
  type: 'firearm' | 'water cannon' | 'baton' | string;
  /** Damage effect that weapon causes */
  damageLevel: 1 | 2 | 3 | 4 | 5 | number;
}