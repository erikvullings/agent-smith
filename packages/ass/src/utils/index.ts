import { IItem } from 'test-bed-schemas';
import { IAgent, IGroup, ILocation } from '../models';
import { redisServices } from '../services';
import { IEnvServices } from '../env-services';

/**
 * Create a GUID
 *
 * @see https://stackoverflow.com/a/2117523/319711
 *
 * @returns RFC4122 version 4 compliant GUID
 */
export const uuid4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    /* eslint no-bitwise: "off" */
    const r = (Math.random() * 16) | 0;
    /* eslint no-bitwise: "off" */
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const { log } = console;

/**
 * Returns a random integer between min (inclusive) and max (inclusive), optionally filtered.
 * If a filter is supplied, only returns numbers that satisfy the filter.
 *
 * @param {number} min
 * @param {number} max
 * @param {Function} filter numbers that do not satisfy the condition
 * @param f
 */
export const random = (
  min: number,
  max: number,
  f?: (n: number, min?: number, max?: number) => boolean
): number => {
  const x = min >= max ? min : Math.floor(Math.random() * (max - min + 1)) + min;
  return f ? (f(x, min, max) ? x : random(min, max, f)) : x;
};

/**
 * Returns a random item from an array
 *
 * @param arr
 */
export const randomItem = <T>(arr: T | T[]): T =>
  arr instanceof Array ? arr[random(0, arr.length - 1)] : arr;

/**
 * calculates the speed of a group based on the distance between members
 *
 * @param Nomembers
 * @param desiredspeed
 */
 export const groupSpeed = (Nomembers: number, desiredspeed: number): number =>{
  if (Nomembers < 500) {
    let distance = 0.65;
    if (Nomembers < 50) {
      distance = 1.35;
    } else if (Nomembers < 100) {
      distance = 1;
    } else if (Nomembers < 250) {
      distance = 0.85;
    } else {
      distance = 0.65;
    }
    const exp1 = (0.35-distance)/0.08;
    const exp2 = (0.35-Math.sqrt(2* Math.pow(distance,2)))/0.08;
    const acc = 2*Math.pow(10,3)*Math.exp(exp1) + Math.sqrt(2)*2*Math.pow(10,3)*Math.exp(exp2)
    const speed = desiredspeed - (1/80)*acc;
    return speed;
  }

    const speed = 0.2;
    return speed;

 }


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
  while (currentIndex !== 0) {
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
 *
 * @param min
 * @param max
 */
export const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 *
 * @param min
 * @param max
 */
export const randomIntInRange = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/** Calculate duration of drone over certain distance */
export const durationDroneStep = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const dist = distanceInMeters(lat1, lon1, lat2, lon2);
  const sec_per_meter = 3600/70000;
  const dur = sec_per_meter * dist;
  return dur;
};

export const inRangeCheck = (min: number, max: number, value: number) => (value - min) * (value - max) <= 0;

/**
 * @param min
 * @param max
 */
/** Convert a number of minutes to the number of msec */
export const minutes = (min: number, max?: number) => (max ? randomInRange(min, max) : min) * 60000;

/** Convert a number of seconds to the number of msec */
export const seconds = (min: number, max?: number) => (max ? randomInRange(min, max) : min) * 1000;

/**
 * @param min
 * @param max
 */
/** Convert a number of hours to the number of msec */
export const hours = (min: number, max?: number) => (max ? randomInRange(min, max) : min) * 3600000;

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const day = now.getDate();

/**
 * @param days
 * @param hours
 * @param minutes
 * @param seconds
 */
/** Create a date relative to today */
export const simTime = (days: number, hours: number, minutes = 0, seconds = 0) =>
  new Date(year, month, day + days, hours, minutes, seconds);

/**
 * @param agent
 */
/** Convert agent to entity item */
export const agentToEntityItem = (agent: IAgent | IGroup): IItem => ({
  id: agent.id,
  type: agent.type,
  location: {
    longitude: agent.actual.coord[0],
    latitude: agent.actual.coord[1],
  },
  children: agent.group,
  tags: {
    agenda: agent.agenda ? agent.agenda.map((i) => i.name).join(', ') : '',
    number_of_members: agent.group ? String(agent.group.length) : '',
    members: agent.group ? agent.group.join(', ') : '',
    force: agent.force ? agent.force : 'white',
  },
});

const transport = ['car' , 'bicycle' , 'bus' , 'train']
const controlling = ['driveTo', 'cycleTo'];

export const agentToFeature = (agent: IAgent | IGroup) => ({
  type: 'Feature',
  geometry: {
    'eu.driver.model.sim.support.geojson.geometry.Point': {
      type: 'Point',
      coordinates: agent.actual.coord,
    } as { [key: string]: any },
  },
  properties: {
    id: agent.id,
    title: agent.type == 'group' && agent.membercount ? String(agent.membercount.length) : '',
    type: agent.type,
    children: agent.group,
    location: {
      longitude: agent.actual.coord[0],
      latitude: agent.actual.coord[1],
    },
    tags: {
      id: agent.id,
      agenda: agent.agenda ? agent.agenda.map((i) => i.name).join(', ') : '',
      members: agent.group ? agent.group.join(', ') : '',
      number_of_members: agent.membercount ? String(agent.membercount.length): '',
      force: agent.force ? agent.force: 'white' ,
      visible:
        ((agent.type == 'group' || transport.indexOf(agent.type) >= 0) && !agent.group)
          ? String(0)
          : agent.steps &&
            agent.steps[0] &&
            controlling.indexOf(agent.steps[0].name) >= 0
          ? String(0)
          : transport.indexOf(agent.type) < 0 &&
            agent.memberOf
          ? String(0)
          : String(1),
    },
  },
});

/**
 * @param a
 * @param rangeInMeter
 * @param type
 */
/** Based on the actual lat/lon, create a place nearby */
export const randomPlaceNearby = (a: IAgent | IGroup, rangeInMeter: number, type: string): ILocation => {
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

/** Based on the coordinates of centre of area, create a place nearby */
export const randomPlaceInArea = (lon: number, lat: number, rangeInMeter: number, type: string): ILocation => {
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
 *
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
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000; // meters
};

/**
 * Generate an approximate distance function for distances up to 50.000m.
 *
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

/**
 * @param ms
 */
/** Delay function */
export const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * @param n
 * @param decimals
 */
/** Round a number or array of numbers to a fixed number of decimals */
export const round = (n: number | number[], decimals = 6) => {
  const factor = Math.pow(10, decimals);
  const r = (x: number) => Math.round(x * factor) / factor;
  return typeof n === 'number' ? r(n) : n.map(r);
};

export const generateAgents = (lng: number, lat: number, count: number, radius: number, group?: IGroup, force?: string) => {
  const offset = () => random(-radius, radius) / 100000;
  const generateLocations = (type: 'home' | 'work' | 'shop' | 'medical' | 'park' ) =>
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
    // const  r= randomInRange(0, 1);
    // if(r < 0.4){
    //   const agent = {
    //     id: uuid4(),
    //     type: 'man',
    //     status: 'active',
    //     home,
    //     // owns: [{ type: 'car', id: 'car1' }],
    //     actual: home,
    //     occupations: [{ id: occupationId, ...occupation }],
    //   } as IAgent;
    //   acc.push(agent);
    // }
    // else if (r < 0.8){
    //   const occupationId = randomItem(occupationIds);
    //   const occupation = occupations[occupationId];
    //   const agent = {
    //     id: uuid4(),
    //     type: 'woman',
    //     status: 'active',
    //     home,
    //     // owns: [{ type: 'car', id: 'car1' }],
    //     actual: home,
    //     occupations: [{ id: occupationId, ...occupation }],
    //   } as IAgent;
    //   acc.push(agent);
    // }
    // else if (r < 0.9){
    //   const schoolId = randomItem(schoolIds);
    //   const school = occupations[schoolId];
    //   const agent = {
    //     id: uuid4(),
    //     type: 'boy',
    //     status: 'active',
    //     home,
    //     // owns: [{ type: 'car', id: 'car1' }],
    //     actual: home,
    //     occupations: [{ id: schoolId, ...school }],
    //   } as IAgent;
    //   acc.push(agent);
    // }
    // else {
    //   const schoolId = randomItem(schoolIds);
    //   const school = occupations[schoolId];
    //   const agent = {
    //     id: uuid4(),
    //     type: 'girl',
    //     status: 'active',
    //     home,
    //     // owns: [{ type: 'car', id: 'car1' }],
    //     actual: home,
    //     occupations: [{ id: schoolId, ...school }],
    //   } as IAgent;
    //   acc.push(agent);
    // }
    const agent = {
      id: uuid4(),
      type: 'man',
      force: force || 'white',
      health: 100,
      status: 'active',
      home,
      // owns: [{ type: 'car', id: 'car1' }],
      actual: group? group.actual: home,
      occupations: [{ id: occupationId, ...occupation }],
      memberOf: group? group.id: undefined,
    } as unknown as IAgent;
    acc.push(agent);
    redisServices.geoAdd('agents', agent);
    if(group && group.group){
      group.group.push(agent.id);
    }
    return acc;
  }, [] as IAgent[]);
  return { agents, locations: { ...homes, ...occupations } };
};

export const addGroup = (agent: IAgent, transport: IAgent, services: IEnvServices) => {
  if (transport.group) {
    if (agent.group) {
      transport.group.push(...agent.group);
      transport.membercount?.push(...agent.group);
      agent.group
        .filter((a) => services.agents[a].group)
        .map((a) => addGroup(services.agents[a], transport, services));
    }
    if (agent.type == 'group') {
      const index = transport.membercount?.indexOf(agent.id);
      if (index) {
        transport.membercount?.splice(index, 1);
      }
    }
  }
};
