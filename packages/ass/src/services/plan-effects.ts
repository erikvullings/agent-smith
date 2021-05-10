import { IPlanEffects } from "../models";

/** 
 * Damage radius in m, messageRadius in m
 * Damage level: health in percentage (an undamaged agent has 100% health)
 * Damage count: the percentage of agents -in the damage radius- that will get damaged
*/
export const planEffects = {
    "drop object": {
        damageRadius: 100,
        damageLevel: 1.0,
        damageCount: 0.7,
        messageRadius: 10000
    },
    "Flee the scene": {
        damageRadius: 0,
        damageLevel: 0,
        messageRadius: 20
    },
    "Call the police": {
        damageRadius: 0,
        damageLevel: 0,
        messageRadius: 10000
    }
} as IPlanEffects