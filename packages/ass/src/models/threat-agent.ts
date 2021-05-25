import { IAgent } from '.';

export interface IThreatAgent extends IAgent {
    /** Equipment that the agent carries */
    equipment?: IAttackEquipment[]
}

export interface IAttackEquipment {
    /** Type of equipment */
    type: 'firearm' | 'water cannon' | 'baton' | string;
    /** Damage effect that weapon causes */
    damageLevel: 1 | 2 | 3 | number;
}
