import { IAgent, ILocation } from '../models';
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

export const inRangeCheck = (min: number, max: number, check:number) => {
  return ((randomIntInRange(0,100)*(randomIntInRange(0,100)-10)) <=0);
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

export const agentToFeature = (agent: IAgent) => ({
  type: 'Feature',
  geometry: {
    'eu.driver.model.sim.support.geojson.geometry.Point': {
      type: 'Point',
      coordinates: agent.actual.coord,
    } as { [key: string]: any },
  },
  properties: {
    id: agent.id,
    type: agent.type,
    force: 'w', // w=white, b=blue, r=red
    children: agent.group,
    location: {
      longitude: agent.actual.coord[0],
      latitude: agent.actual.coord[1],
    },
    tags: {
      agenda: agent.agenda ? agent.agenda.map((i) => i.name).join(', ') : '',
    },
  },
});

/** Based on the actual lat/lon, create a place nearby */
export const randomPlaceNearby = (a: IAgent, rangeInMeter: number, type: string): ILocation => {
  const {
    actual: {
      coord: [lon, lat],
    },
  } = a;
  const r = rangeInMeter / 111139;
  return {
    type,
    // 1 degree is approximately 111111 meters
    coord: [randomInRange(lon - r, lon + r), randomInRange(lat - r, lat + r)],
  };
};

const R = 6378.137; // Radius of earth in KM
const Deg2Rad = Math.PI / 180;

/**
 * Calculate the distance in meters between two WGS84 coordinates
 * @param lat1
 * @param lon1
 * @param lat2
 * @param lon2
 * @source https://stackoverflow.com/a/11172685/319711
 */
export const distanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  // generally used geo measurement function
  const dLat = lat2 * Deg2Rad - lat1 * Deg2Rad;
  const dLon = lon2 * Deg2Rad - lon1 * Deg2Rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000; // meters
};

/**
 * Generate an approximate distance function for distances up to 50.000m.
 * @param lat Average latitude of the simulation, used to approximate the length of a longitude circle
 * @see https://jonisalonen.com/2014/computing-distance-between-coordinates-can-be-simple-and-fast/
 */
export const simplifiedDistanceFactory = () => {
  // const coslat = Math.cos((latitudeAvg * Math.PI) / 180);
  const f = Math.PI / 360;
  /** Distance between WGS84 coordinates in meters */
  return (lat0: number, lng0: number, lat1: number, lng1: number) => {
    const x = lat0 - lat1;
    // const y = (lng0 - lng1) * coslat;
    const y = (lng0 - lng1) * Math.cos((lat0 + lat1) * f);
    // 111194.92664455873 = R * Math.PI / 180 where R is the radius of the Earth in meter is 6371000
    return 111194.92664455873 * Math.sqrt(x * x + y * y);
  };
};

/** Delay function */
export const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Round a number or array of numbers to a fixed number of decimals */
export const round = (n: number | number[], decimals = 6) => {
  const factor = Math.pow(10, decimals);
  const r = (x: number) => Math.round(x * factor) / factor;
  return typeof n === 'number' ? r(n) : n.map(r);
};

export const generateAgents = (lng: number, lat: number, count: number) => {
  const offset = () => random(-10000, 10000) / 100000;
  const generateLocations = (type: 'home' | 'work') =>
    range(1, count / 2).reduce((acc) => {
      const coord = [lng + offset(), lat + offset()] as [number, number];
      const id = uuid4();
      acc[id] = { type, coord };
      return acc;
    }, {} as { [key: string]: ILocation });
  const occupations = generateLocations('work');
  const occupationIds = Object.keys(occupations);
  const homes = generateLocations('home');
  const homeIds = Object.keys(homes);
  const agents = range(1, count).reduce((acc) => {
    const home = homes[randomItem(homeIds)];
    const occupationId = randomItem(occupationIds);
    const occupation = occupations[occupationId];
    const agent = {
      id: uuid4(),
      type: 'man',
      status: 'active',
      home,
      // owns: [{ type: 'car', id: 'car1' }],
      actual: home,
      occupations: [{ id: occupationId, ...occupation }],
    } as IAgent;
    acc.push(agent);
    return acc;
  }, [] as IAgent[]);
  return { agents, locations: Object.assign({}, homes, occupations) };
};
