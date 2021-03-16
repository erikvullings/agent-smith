import { envServices, IEnvServices } from '../env-services';
import { IAgent } from '../models';
import redis from "redis";

const client = redis.createClient();

const geoRad = (agent: IAgent, services: IEnvServices, radius: string) => {
    
  client.on("error", function(error: any) {
        console.error(error);
      });
      
  client.georadius(
    'agents',                                 //key
    String(agent.actual.coord[0]),            //longitude
    String(agent.actual.coord[1]),            //latitude
    radius,                                   //radius value
    'm',                                      //radius unit
    'WITHCOORD',                              //include coordinates in result
    'WITHDIST',                               //include the distance from supplied latitude & longitude
    'ASC',                                    //sort (closest first)
    function(err: any, results: any[]) {
      if (err) { next(err); } else { 
        results = results.map(function(aResult: any[][]) {
          var
            resultObject = {
              key       : aResult[0],
              distance  : aResult[1],
              longitude : aResult[2][0],
              latitude  : aResult[2][1]
            };
              
          return console.log(resultObject);} )}});
}

function geoAdd (agent: IAgent) {
  console.log(String(agent.actual.coord[0]));
  console.log(agent.id);

  client.geoadd(
    'agents',    
    String(agent.actual.coord[0]),           
    String(agent.actual.coord[1]),             
    agent.id,                
  );
}

  
function next(err: any) {
    throw new Error('Function not implemented.');
}

export const redisServices = {
  geoAdd,
  geoRad
};