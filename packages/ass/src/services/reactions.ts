import { IReactions } from '../models';


export const reaction = {
    'drop object': {
            'blue':{urgency:1,plans:[[{ 'name': 'Go to specific location', 'options' : {}}
                                    ,{ 'name': 'Check object', 'options' : {}},
                                    { 'name': 'Go to work', 'options' : {}}]]},
    },
    'Run away': {
        'blue':{urgency:1,plans:[[{ 'name': 'Follow person', 'options' : {}},
                                                { 'name': 'Go to work', 'options' : {}},
                                                { 'name': 'Work', 'options' : {} }]]},
        'white':{urgency:1,plans:[[{ 'name': 'Follow person', 'options': {}}]]},
    },
    'Call the police': {
        'blue':{urgency:1,plans:[[{ 'name': 'Go to specific location', 'options' : {}},
                                        { 'name': 'Wait', 'options' : {'duration': 1}},
                                                { 'name': 'Go to work', 'options' : {}},
                                                { 'name': 'Stay at police station', 'options' : {} }]]},
    },
} as IReactions
