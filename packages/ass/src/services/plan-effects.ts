import { IPlanEffects } from '../models';

/**
 * @property {number} damageRadius - Radius to give damage in m
 * @property {number} damageLevel - Health in percentage: 0-100 (an undamaged agent has 100% health)
 * @property {number} runDistance -
 * @property {number} panicLevel -
 * @property {number} panicCause -
 * @property {number} delayLevel - Radius to give damage in m
 * @property {number} delayCause - Radius to give damage in m
 * @property {number} severity - How severe the consequences of the plan are: 1-5
 * @property {number} messageRadius - Radius to send message in m
 */
export const planEffects = {
    'Chaos': {
        damageRadius: 0,
        damageLevel: 0,
        runDistance: 1000,
        panicLevel: 100,
        delayLevel: 0,
        severity: 5,
        messageRadius: 400,
    },
    'Drop object': {
        damageRadius: 0,
        damageLevel: 0,
        runDistance: 1000,
        panicLevel: 30,
        delayLevel: 0,
        severity: 5,
        messageRadius: 100,
    },
    'Drop bomb': {
        damageRadius: 100,
        damageLevel: 100,
        runDistance: 1000,
        panicLevel: 100,
        delayLevel: 0,
        severity: 5,
        messageRadius: 300,
    },
    'Drop gas': {
        damageRadius: 0,
        damageLevel: 0,
        runDistance: 1000,
        panicLevel: 50,
        delayLevel: 30,
        delayCause: 'gas',
        severity: 4,
        messageRadius: 300,
    },
    'Play message': {
        damageRadius: 0,
        damageLevel: 0,
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
    'Damage person': {
        damageRadius: 0,
        damageLevel: 50,
        panicLevel: 0,
        delayLevel: 0,
        severity: 2,
        messageRadius: 10,
    },
} as IPlanEffects