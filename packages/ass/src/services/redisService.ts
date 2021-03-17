import { IAgent } from '../models';

const Redis = require("ioredis");
const redis = new Redis();

const geoRad = async (agent: IAgent, radius: string) => {
  redis.georadius(
  'agents',                                 //key
  String(agent.actual.coord[0]),            //longitude
  String(agent.actual.coord[1]),            //latitude
  radius,                                   //radius value
  'km',                                      //radius unit
  'WITHCOORD',                              //include coordinates in result
  'WITHDIST',                               //include the distance from supplied latitude & longitude
  'ASC',                                    //sort (closest first)
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
const geoAdd = async (agent: IAgent) => {
  redis.geoadd(
    'agents',    
    String(agent.actual.coord[0]),           
    String(agent.actual.coord[1]),             
    agent.id,                
  );
  //console.log("Done", agent.id)
}

const flushDb = () => {
  return redis.flushdb();
  //console.log("flushed")
}

export const redisServices = {
  geoAdd,
  geoRad,
  flushDb
};