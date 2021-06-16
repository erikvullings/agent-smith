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
                , { 'name': 'Unpanic', 'options': {} }
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
                , { 'name': 'Unpanic', 'options': {} }
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
                , { 'name': 'Unpanic', 'options': {} }
                , { 'name': 'Undelay', 'options': {} }
                , { 'name': 'Go home', 'options': {} }]],
        },
        'tbp': {
            urgency: 2, plans: [[{ 'name': 'Run away', 'options': {} }
                , { 'name': 'Unpanic', 'options': {} }
                , { 'name': 'Undelay', 'options': {} }
                , { 'name': 'Go home', 'options': {} }]],
        },
    },
    'Play message': {
        'blue': {
            urgency: 2, plans: [[{ 'name': 'Go to specific location', 'options': {} }
                , { 'name': 'Check object', 'options': {} },
            { 'name': 'Go to work', 'options': {} }]],
        },
        'white': {
            urgency: 3, plans: [[{ 'name': 'Run away', 'options': {} }
                , { 'name': 'Unpanic', 'options': {} }
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
            urgency: 1, plans: [[{ 'name': 'Follow person', 'options': {} }]],
        },
    },
    'Go to work': {
        'tbp': {
            urgency: 1, plans: [[{ 'name': 'Go to base', 'options': {} }]],
        },
    },
    'Damage person': {
        'white': {
            urgency: 1, plans: [[{ 'name': 'Run away', 'options': {} }]],
        },
        'red': {
            urgency: 1, plans: [[{ 'name': 'Run away', 'options': {} }]],
        },
    },
    'Chaos': {
        'white': {
            urgency: 1, plans: [[{ 'name': 'Run away', 'options': {} }]],
        },
        'blue': {
            urgency: 1, plans: [[{ 'name': 'Run away', 'options': {} }]],
        },
    },
    'Walk to person': {
        'white': {
            urgency: 1, plans: [[{ 'name': 'Wait for person', 'options': { reacting: true } }]],
        },
        'blue': {
            urgency: 1, plans: [[{ 'name': 'Wait for person', 'options': { reacting: true } }]],
        },
    },
    'Wait for person': {
        'white': {
            urgency: 2, plans: [[{ 'name': 'Wait', 'options': { reacting: true } }]],
        },
    },
    'Chat': {
        'white': {
            urgency: 2, plans: [[{ 'name': 'Chat', 'options': { reacting: true } }]],
        },
    },
} as IReactions
