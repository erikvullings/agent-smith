# Types

The folder typedoc contains an html file with a description of all the types and interfaces used for the simulations.

# Editing scenarios

## Sim Configuration files
Configuration files are used to generate the different scenarios for the simulation. Each scenario has it’s own configuration file. 
To make a simulation of one of the scenarios the right jsonSimConfig has to be selected in the sim-controller.
The configuration file contains the following properties: settings, generateSettings, locations, equipment, hasEquipment, customAgents, customAgendas and customTypeAgendas.

### settings
This is where the general settings, such as the start time of the simulation, are defined.
```bash
    "settings": {
        startTimeHours?: number,
        startTimeMinutes?: number,
    }
```

### generateSettings
This is used to generate multiple random agents in an area.

To generate these agents the number of agents you want generated (agentCount) and the center (centerCoord) and radius of the area have to be defined. It is optional to also define some properties, the force for example, of the agents.

The optional property “object” is used when you want the generated agents to carry an object with them. In that case the type of the object is defined here.
```bash
    "generateSettings": [
        {
            agentCount: number,
            centerCoord:  [lon, lat],
            startCoord?: [lon, lat],
            endCoord?:  [lon, lat],
            radius: number,
            line?: boolean,
            type?: string,
            force?: string,
            object?: string,
            memberCount?: number,
        }
    ]
```

### locations
This is where important locations of the area are defined. 
```bash
    "locations": {
        id: {
            type: string,
            coord: [
                lon,
                lat
            ]
        }
    }
```

### equipment
If there is a type of equipment that is used often it can be defined here.
```bash
    "equipment": {
        equipmentId: string;
        equipmentProperties: IEquipment;
    }
```

### hasEquipment
For each of the previously defined equipment, a list of the id’s of the agents that carry that equipment is defined. 
```bash
    "hasEquipment": {
        equipmentId: [
            agentId1,
            agentId2,
        ]
    }
```

### customAgents
This is where agents that are too specific to be generated with generateSettings are defined. All the possible properties of an agent can be defined here.
```bash
    "customAgents": {
        tbp: IAgent[];
        blue: IAgent[];
        white: IAgent[];
        red: IAgent[];
    }
```

### customAgendas
This links a specific agenda to an agent ID. The agenda will be given to the agent with this ID. The agendas are defined by a list of plans and options. The plans that can be chosen are defined in plans.ts. 
```bash
    "customAgendas": [
        {
            agentId: string;
            agendaItems: IStep[];
        }
    ]
```

### customTypeAgendas
This links a specific agenda to a combination of the force and type of an agent. This is done in the same format as the customAgendas, but with the properties type and force instead of agentID. 
If the agenda of an agent is not defined in customAgendas or customTypeAgendas it is generated in agendas.ts.
```bash
    "customTypeAgendas": [
        {
            agentType: string;
            agentForce: string;
            agendaItems: IStep[];
        }
    ]
```

# Interaction between agents
## Message-service

To implement communication between agents there is a message-service. With the message-service you can send a message to other agents. These “messages” contain the plan that the agent is currently doing.

The receiving agents only react to messages that have a reaction specified in reactions.ts. In reactions.ts there is also a property “urgency”. The urgency is used to determine if the receiving agent will really react to the message. If the priority of its current action is higher than the urgency of the message, the agent will not react.

## Damage-service

In certain cases, one agent can give damage to other agents. To send damage you can use the damage-service in your plan in plans.ts. In the planEffects.ts there are some properties specified about the effects of some plans. With this information, the range of the receiving agents and different aspects regarding the results of an action are described. This information is used in the message-service, damage-service and the dispatch service.

## Dispatch-service

In some situations, police or SIS agents will have to intervene. To send defence to a location you can use the dispatch-service. If the eventType is terrorism the SIS agents will be sent to the location, otherwise police close to the area or the police at the police station will go to the scene.