import { IAgent, ILocation } from '../models';

const Redis = require("ioredis");
const redis = new Redis();

redis.on('error', function(err: any) {
  console.log('Error' + err)
});

/**  The input for georadius: 
 *   (key,longitude,latitude,radius value, radius unit(m,km),include coordinates in result,
 *    include the distance from supplied latitude & longitude, sort(closest first)) */
const geoRad = async (agent: IAgent, radius: string) => {
  var resArray: { key: any[]; distance: any[]; longitude: any; latitude: any; }[] = [];
  redis.georadius(
    'agents',                                 
    String(agent.actual.coord[0]),            
    String(agent.actual.coord[1]),            
    radius,                                   
    'm',                                     
    'WITHCOORD',                              
    'WITHDIST',                               
    'ASC',                                    
    function (err: any, result: any){
      if (err) {
        console.error(err);
      } else {
        result.map(function(resArr: any[][]) {
          var res = {
              key       : resArr[0],
              distance  : resArr[1],
              longitude : resArr[2][0],
              latitude  : resArr[2][1]
            };
            console.log(res);
            resArray.push(res)});
          };
    });
    return resArray;
  };
   
/** Calculate distance between two points */
const geoDist = async (agent1: IAgent, agent2: IAgent) => {
  redis.geodist(
  'agents',                                 
  agent1.id,            
  agent2.id,
  function (err: any, result: any) {
    if (err) {
      console.error(err);
    } else {
      console.log(result); 
      return result;
    }
  });
}

/** Search for agents in area */
const geoSearch = async (location: ILocation, radius: string): Promise<any> => {
  var resArray: { key: any[]; distance: any[]; longitude: any; latitude: any; }[] = [];
    await redis.geosearch(
      'agents',                                 
      'FROMLONLAT',            
      location.coord[0],
      location.coord[1],
      'BYRADIUS',
      radius,
      'km',
      'WITHCOORD',                              
      'WITHDIST',                                 
      'ASC',
      function (err: any, result: any[][]) {
        if (err) {
          console.error(err);
          return null;
        } else {
          result.map(function(resArr: any[][]) {
            var res = {
                key       : resArr[0],
                distance  : resArr[1],
                longitude : resArr[2][0],
                latitude  : resArr[2][1]
              };
              resArray.push(res)});
            };
          })
      return resArray;
};

/** Add new value to key */
const geoAdd = async (key: string, agent: IAgent) => {
  redis.geoadd(
    key,    
    String(agent.actual.coord[0]),           
    String(agent.actual.coord[1]),             
    agent.id                
  );
}

/** Add multiple values to key */
const geoAddBatch = async (key: string, agents: Array<IAgent>) => {
  let arr: string[][] = [];
  agents.forEach(agent => {
    arr.push(["geoadd", key, String(agent.actual.coord[0]),String(agent.actual.coord[1]),agent.id])
  });

  redis.pipeline(arr)
  .exec(() => {
    console.log("Batch done");
  });
}

/** Remove all keys from database */
const flushDb = function() {
  redis.flushdb();
}

export const redisServices = {
  geoAdd,
  geoRad,
  geoDist,
  flushDb,
  geoAddBatch,
  geoSearch
};