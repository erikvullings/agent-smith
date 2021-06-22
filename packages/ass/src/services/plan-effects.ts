import { IPlanEffects } from '../models';

/**
 * Damage radius in m, messageRadius in m
 * Damage level: health in percentage (an undamaged agent has 100% health)
 * Damage count: the percentage of agents -in the damage radius- that will get damaged
 */
export const planEffects = {
    'Chaos': {
        damageRadius: 0,
        damageLevel: 0,
        damageCount: 0,
        runDistance: 50,
        panicLevel: 100,
        delayLevel: 0,
        severity: 5,
        messageRadius: 300,
    },
    'Drop object': {
        damageRadius: 0,
        damageLevel: 0,
        damageCount: 0,
        runDistance: 50,
        panicLevel: 30,
        delayLevel: 0,
        severity: 5,
        messageRadius: 100,
    },
    'Drop bomb': {
        damageRadius: 100,
        damageLevel: 100,
        damageCount: 0.7,
        runDistance: 500,
        panicLevel: 100,
        delayLevel: 0,
        severity: 5,
        messageRadius: 300,
    },
    'Drop gas': {
        damageRadius: 0,
        damageLevel: 0,
        damageCount: 0,
        runDistance: 500,
        panicLevel: 50,
        delayLevel: 30,
        delayCause: 'gas',
        severity: 4,
        messageRadius: 300,
    },
    'Play message': {
        damageRadius: 0,
        damageLevel: 0,
        damageCount: 0,
        runDistance: 500,
        panicLevel: 10,
        delayLevel: 0,
        severity: 1,
        messageRadius: 200,
    },
    'Flee the Scene': {
        damageRadius: 0,
        damageLevel: 0,
        panicLevel: 30,
        delayLevel: 0,
        severity: 3,
        messageRadius: 20,
    },
    'Call the Police': {
        damageRadius: 0,
        damageLevel: 0,
        panicLevel: 0,
        delayLevel: 0,
        severity: 2,
        messageRadius: 10000,
    },
    'Go to park': {
        damageRadius: 1000,
        damageLevel: 100,
        panicLevel: 0,
        delayLevel: 0,
        severity: 5,
        messageRadius: 1000,
    },
    'Damage person': {
        damageRadius: 0,
        damageLevel: 50,
        panicLevel: 0,
        delayLevel: 0,
        severity: 2,
        messageRadius: 10,
    },
} as IPlanEffects