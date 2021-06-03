import { IAgent, ILocation } from '../models';

const Redis = require('ioredis');

const redis = new Redis();

redis.on('error', (err: any) => {
  console.log(`Error${err}`)
});

/**
 * @param agent1
 * @param agent2
 * Calculate distance between two points
 */
const geoDist = async (agent1: IAgent, agent2: IAgent) => {
  redis.geodist(
    'agents',
    agent1.id,
    agent2.id,
    (err: any, result: any) => {
      if (err) {
        console.error(err);
      } else {
        console.log(result);
        return result;
      }
    });
};

/** Search for agents in area */

/** The input for redis.geosearch:
 * (key,longitude,latitude,radius value, radius unit(m,km),include coordinates in result,
 * include the distance from supplied latitude & longitude, sort(closest first))
 */

const geoSearch = async (location: ILocation, radius: number, agent?: IAgent): Promise<any> => {
  const resArray: { key: any[]; distance: any[]; longitude: any; latitude: any; }[] = [];
  await redis.geosearch(
    'agents',
    'FROMLONLAT',
    location.coord[0],
    location.coord[1],
    'BYRADIUS',
    radius,
    'm',
    'WITHCOORD',
    'WITHDIST',
    'ASC',
    (err: any, result: any[][]) => {
      if (err) {
        console.error(err);
      } else {
        result.map((resArr: any[][]) => {
          const res = {
            key: resArr[0],
            distance: resArr[1],
            longitude: resArr[2][0],
            latitude: resArr[2][1],
          };
          if (agent !== undefined && String(res.key) !== agent.id) {
            resArray.push(res);
          }
        });
      };
    })
  return resArray;
};

/**
 * @param key
 * @param agent
 * Add new value to key
 */
const geoAdd = async (key: string, agent: IAgent) => {
  redis.geoadd(
    key,
    String(agent.actual.coord[0]),
    String(agent.actual.coord[1]),
    agent.id
  );
}
/**
 * @param key
 * @param agents
 * Add multiple values to key
 */
const geoAddBatch = async (key: string, agents: IAgent[]) => {
  const arr: string[][] = [];
  agents.forEach(agent => {
    arr.push(['geoadd', key, String(agent.actual.coord[0]), String(agent.actual.coord[1]), agent.id])
  });
  redis.pipeline(arr)
    .exec(() => {
      console.log('Batch done');
    });
}

/** Remove all keys from database */
const flushDb = () => {
  redis.flushdb();
}

export const redisServices = {
  geoAdd,
  geoDist,
  flushDb,
  geoAddBatch,
  geoSearch,
};