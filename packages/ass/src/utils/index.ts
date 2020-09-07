import { IAgent } from '../models';
import { IItem } from 'test-bed-schemas';

/**
 * Create a GUID
 * @see https://stackoverflow.com/a/2117523/319711
 *
 * @returns RFC4122 version 4 compliant GUID
 */
export const uuid4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // tslint:disable-next-line:no-bitwise
    const r = (Math.random() * 16) | 0;
    // tslint:disable-next-line:no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const log = console.log;

/**
 * Returns a random integer between min (inclusive) and max (inclusive), optionally filtered.
 * If a filter is supplied, only returns numbers that satisfy the filter.
 *
 * @param {number} min
 * @param {number} max
 * @param {Function} filter numbers that do not satisfy the condition
 */
export const random = (min: number, max: number, f?: (n: number, min?: number, max?: number) => boolean): number => {
  const x = min >= max ? min : Math.floor(Math.random() * (max - min + 1)) + min;
  return f ? (f(x, min, max) ? x : random(min, max, f)) : x;
};

/**
 * Returns a random item from an array
 */
export const randomItem = <T>(arr: T | T[]): T => (arr instanceof Array ? arr[random(0, arr.length - 1)] : arr);

/**
 * Shuffle the items randomly
 *
 * @static
 * @param {any[]} array
 * @returns a shuffled list of items
 * see also http://stackoverflow.com/a/2450976/319711
 */
export const shuffle = <T>(array: T[]) => {
  let currentIndex = array.length;
  let temporaryValue: T;
  let randomIndex: number;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
};

/**
 * Generate a sequence of numbers between from and to with step size: [from, to].
 *
 * @static
 * @param {number} from
 * @param {number} to : inclusive
 * @param {number} [step=1]
 * @returns
 */
export const range = (from: number, to: number, step: number = 1) => {
  const arr = [] as number[];
  if (step > 0) {
    for (let i = from; i <= to; i += step) {
      arr.push(i);
    }
  } else {
    for (let i = from; i >= to; i += step) {
      arr.push(i);
    }
  }
  return arr;
};

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
export const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
export const randomIntInRange = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/** Convert a number of minutes to the number of msec */
export const minutes = (min: number, max?: number) => (max ? randomInRange(min, max) : min) * 60000;

/** Convert a number of hours to the number of msec */
export const hours = (min: number, max?: number) => (max ? randomInRange(min, max) : min) * 3600000;

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const day = now.getDate();

/** Create a date relative to today */
export const simTime = (days: number, hours: number, minutes = 0, seconds = 0) =>
  new Date(year, month, day + days, hours, minutes, seconds);

/** Convert agent to entity item */
export const agentToEntityItem = (agent: IAgent): IItem => ({
  id: agent.id,
  type: agent.type,
  location: {
    longitude: agent.actual.coord[0],
    latitude: agent.actual.coord[1],
  },
  children: agent.group,
  tags: {
    agenda: agent.agenda ? agent.agenda.map((i) => i.name).join(', ') : '',
  },
});
