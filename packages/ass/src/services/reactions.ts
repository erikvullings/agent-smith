import { IReactions } from "../models";


export const reaction = {
    "drop object": {
            "blue":{urgency:1,plans:[[{ "name": "Go to specific location", "options" : {}}
                                    ,{ "name": "Check object", "options" : {}}]]},
            "red":{urgency:1,plans:[[{ "name": "Run away", "options": {}}]]},
            "white":{urgency:1,plans:[[{ "name": "Run away", "options": {}}]]}
    },
    "test": {
        "blue":{urgency:1,plans:[[{ "name": "Go home", "options" : {}},
                                                { "name": "Go to work"},
                                                { "name": "Work" }]]},
        "red":{urgency:1,plans:[[{ "name": "Run away", "options": {}}]]},
        "white":{urgency:1,plans:[[{ "name": "Run away", "options": {}}]]}
},
} as IReactions
