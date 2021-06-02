import { IReactions } from '../models';


export const reaction = {
    'Drop object': {
        'blue': {
            urgency: 2, plans: [[{ 'name': 'Go to specific location', 'options': {} }
                , { 'name': 'Check object', 'options': {} },
            { 'name': 'Go to work', 'options': {} }]],
        },
        'white': {
            urgency: 2, plans: [[{ 'name': 'Run away', 'options': {} }
                , { 'name': 'Go home', 'options': {} }]],
        },
    },
    'Drop bomb': {
        'blue': {
            urgency: 2, plans: [[{ 'name': 'Go to specific location', 'options': {} }
                , { 'name': 'Check object', 'options': {} },
            { 'name': 'Go to work', 'options': {} }]],
        },
        'white': {
            urgency: 2, plans: [[{ 'name': 'Run away', 'options': {} }
                , { 'name': 'Go home', 'options': {} }]],
        },
    },
    'Drop gas': {
        'blue': {
            urgency: 2, plans: [[{ 'name': 'Go to specific location', 'options': {} }
                , { 'name': 'Check object', 'options': {} },
            { 'name': 'Go to work', 'options': {} }]],
        },
        'white': {
            urgency: 2, plans: [[{ 'name': 'Run away', 'options': {} }
                , { 'name': 'Go home', 'options': {} }]],
        },
    },
    'Run away': {
        'blue': {
            urgency: 2, plans: [[{ 'name': 'Follow person', 'options': {} },
            { 'name': 'Go to work', 'options': {} },
            { 'name': 'Work', 'options': {} }]],
        },
        'white': { urgency: 2, plans: [[{ 'name': 'Follow person', 'options': {} }]] },
    },
    'Call the police': {
        'blue': {
            urgency: 1, plans: [[{ 'name': 'Go to specific location', 'options': {} },
            { 'name': 'Wait', 'options': { 'duration': 1 } },
            { 'name': 'Go to work', 'options': {} },
            { 'name': 'Stay at police station', 'options': {} }]],
        },
    },
    'Interrogation': {
        'white': {
            urgency: 1, plans: [[{ 'name': 'Interrogation', 'options': {} }]],
        },
        'red': {
            urgency: 1, plans: [[{ 'name': 'Interrogation', 'options': {} }]],
        },
    },
    'Go to park': {
        'blue': {
            urgency: 1, plans: [[{ 'name': 'Damage person', 'options': {} }]],
        },
    },
    'Damage person': {
        'white': {
            urgency: 1, plans: [[{ 'name': 'Run away', 'options': {} }]],
        },
        'red': {
            urgency: 1, plans: [[{ 'name': 'Run away', 'options': {} }]],
        },
    }
} as IReactions
