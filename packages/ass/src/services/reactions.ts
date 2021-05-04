import { IReactions } from "../models";


export const reaction = {
    "drop object": {
            "blue":{urgency:1,plans:[[{ "name": "Go to specific location", "options" : {}}
                                    ,{ "name": "Check object", "options" : {}},
                                    { "name": "Go to work", "options" : {}}]]},
            "red":{urgency:1,plans:[[{ "name": "Run away", "options": {}}]]},
            "white":{urgency:1,plans:[[{ "name": "Run away", "options": {}}]]}
    },
    "Flee the scene": {
        "blue":{urgency:1,plans:[[{ "name": "Go to specific location", "options" : {}},
                                                { "name": "Go to work"},
                                                { "name": "Work" }]]},
        "red":{urgency:1,plans:[[{ "name": "Run away", "options": {}}]]},
        "white":{urgency:1,plans:[[{ "name": "Run away", "options": {}}]]}
},
} as IReactions
