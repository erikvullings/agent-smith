import { redisServices } from ".";
import { IEnvServices } from "../env-services";
import { IAgent, IGroup } from "../models";


const checkSurroundings = async (agent: IAgent | IGroup, services: IEnvServices) => {
    if(agent.force == 'red'){

    }
    else {
        
        const redisAgents = await redisServices.geoSearch(agent.actual,100,agent) as Array<any>;
        const redAgents = (redisAgents.filter(a => a.key !== agent.id ).map((a) => a = services.agents[a.key])).filter((a) => a.visibleForce == 'red' && a.status != "inactive" );

        if(redAgents.length>0){           
        console.log("found red", redAgents[0]);
            // if(agent.force == "blue" && (!agent.agenda[0].options?.reacting || agent.agenda[0].options?.reacting == false)){
                
            // }
            if(agent.force == "white"){
                
            }
        }
    
    }

};

export const behaviourServices = {
    checkSurroundings
};