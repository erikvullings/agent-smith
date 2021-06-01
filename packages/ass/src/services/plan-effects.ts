import { IPlanEffects } from '../models';

/**
 * Damage radius in m, messageRadius in m
 * Damage level: health in percentage (an undamaged agent has 100% health)
 * Damage count: the percentage of agents -in the damage radius- that will get damaged
 */
export const planEffects = {
    'drop object': {
        damageRadius: 0,
        damageLevel: 0,
        damageCount: 0,
        panicLevel: 30,
        delayLevel: 0,
        severity: 3,
        messageRadius: 1000,
    },
    'drop bomb': {
        damageRadius: 100,
        damageLevel: 100,
        damageCount: 0.7,
        panicLevel: 100,
        delayLevel: 0,
        severity: 5,
        messageRadius: 10000,
    },
    'drop gas': {
        damageRadius: 0,
        damageLevel: 0,
        damageCount: 0,
        panicLevel: 50,
        delayLevel: 0,
        severity: 4,
        messageRadius: 10000,
    },
    'play message': {
        damageRadius: 0,
        damageLevel: 0,
        damageCount: 0,
        panicLevel: 10,
        delayLevel: 0,
        severity: 3,
        messageRadius: 1000,
    },
    'fleeTheScene': {
        damageRadius: 0,
        damageLevel: 0,
        panicLevel: 30,
        delayLevel: 0,
        severity: 3,
        messageRadius: 20,
    },
    'callThePolice': {
        damageRadius: 0,
        damageLevel: 0,
        panicLevel: 0,
        delayLevel: 0,
        severity: 2,
        messageRadius: 10000,
    },
} as IPlanEffects