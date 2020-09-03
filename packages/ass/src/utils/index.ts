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
