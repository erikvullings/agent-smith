import { IEnvServices } from '../env-services';
import { ActivityList, IAgent, ILocation } from '../models';


/** Calculate distance between two points */
const chatFunction = async (randomAgent: IAgent, closeAgent: IAgent, services: IEnvServices) => {
    var destinationCoord: ILocation = {type: "road",
    coord: [(randomAgent.actual.coord[0]+closeAgent.actual.coord[0])/2,
    (randomAgent.actual.coord[1]+closeAgent.actual.coord[1])/2]};
    console.log(destinationCoord)

   if(randomAgent.agenda != undefined && closeAgent.agenda != undefined){
    randomAgent.destination = destinationCoord;
    closeAgent.destination = destinationCoord;

     let timesim = services.getTime();
     timesim.setMinutes(timesim.getMinutes()+ 60)

     var newAgenda1 : ActivityList = [{name: 'Go to specific location', options: { startTime: timesim, priority: 1, destination: destinationCoord }},
                                     { name: 'Chat', options: { priority: 2 } }];
     randomAgent.agenda = newAgenda1.concat(randomAgent.agenda);

     var newAgenda2 : ActivityList = [{name: 'Go to specific location', options: { startTime: timesim, priority: 1, destination: destinationCoord }},
                                 { name: 'Chat', options: { priority: 2 } }];
     closeAgent.agenda = newAgenda2.concat(closeAgent.agenda);


     console.log("agenda1",randomAgent.agenda)
     console.log("agenda2",closeAgent.agenda)

}
};
  


export const chatServices = {
    chatFunction,
};