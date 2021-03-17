import { IAgent } from '../models';

const Redis = require("ioredis");
const redis = new Redis();

 *   (key,longitude,latitude,radius value, radius unit,include coordinates in result,
 *    include the distance from supplied latitude & longitude, sort(closest first)) */
const geoRad = async (agent: IAgent, radius: string) => {
  redis.georadius(
  'agents',                                 //key
  'agents',                                 
  String(agent.actual.coord[0]),            
  String(agent.actual.coord[1]),            
  radius,                                   
  'km',                                     
  'WITHCOORD',                              
  'WITHDIST',                               
  'ASC',                                    
  ).then((res: any) => 
  res.map(function(resArr: any[][]) {
               var res = {
                   key       : resArr[0],
                   distance  : resArr[1],
                   longitude : resArr[2][0],
                   latitude  : resArr[2][1]
                 };
                 console.log(res)
                 return res;
  }));
}

/** Calculate distance between two agents */
const geoDist = async (agent1: IAgent, agent2: IAgent) => {
  redis.geodist(
  'agents',                                 
  agent1.id,            
  agent2.id).then((res: any) => console.log(res));;
  };

/** Add new value to key */
const geoAdd = async (key: string, agent: IAgent) => {
  redis.geoadd(
    key,    
    String(agent.actual.coord[0]),           
    String(agent.actual.coord[1]),             
    agent.id,                
  );
  //console.log("Done", agent.id)
}

const flushDb = () => {
  return redis.flushdb();
}

export const redisServices = {
  geoAdd,
  geoRad,
  geoDist,
  flushDb
};