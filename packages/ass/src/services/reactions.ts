import { IReactions } from '../models';


export const reaction = {
    'Drop object': {
        'blue': {
            urgency: 2, plans: [[{ 'name': 'Go to specific location', 'options': { reacting: true } }
                , { 'name': 'Check object', 'options': {} },
            { 'name': 'Go to work', 'options': {} }]],
        },
        'white': {
            urgency: 2, plans: [[{ 'name': 'Run away', 'options': { reacting: true } }
                , { 'name': 'Unpanic', 'options': {} }
                , { 'name': 'Go home', 'options': {} }]],
        },
    },
    'Drop bomb': {
        'blue': {
            urgency: 2, plans: [[{ 'name': 'Go to specific location', 'options': { reacting: true } }
                , { 'name': 'Check object', 'options': {} },
            { 'name': 'Go to work', 'options': {} }]],
        },
        'white': {
            urgency: 2, plans: [[{ 'name': 'Run away', 'options': { reacting: true } }
                , { 'name': 'Unpanic', 'options': {} }
                , { 'name': 'Go home', 'options': {} }]],
        },
    },
    'Drop gas': {
        'blue': {
            urgency: 2, plans: [[{ 'name': 'Go to base', 'options': { reacting: true } }
                , { 'name': 'Guard', 'options': {duration: 70000} },
            ]],
        },
        'white': {
            urgency: 2, plans: [[{ 'name': 'Run away', 'options': { reacting: true } }
                , { 'name': 'Unpanic', 'options': {} }
                , { 'name': 'Undelay', 'options': {} }
                , { 'name': 'Go home', 'options': {} }]],
        },
        'tbp': {
            urgency: 1, plans: [[{ 'name': 'Go to base', 'options': { reacting: true } }
                , { 'name': 'Wait', 'options': { duration: 70000} }]],
        },
    },
    'Play message': {
        'blue': {
            urgency: 2, plans: [[{ 'name': 'Go to base', 'options': { reacting: true } },
                { 'name': 'Release', 'options': {reacting: true} }
                , { 'name': 'Patrol', 'options': {} },
                { 'name': 'Patrol', 'options': {} },
                { 'name': 'Patrol', 'options': {} },
                { 'name': 'Patrol', 'options': {} },
            ]],
        },
        'white': {
            urgency: 3, plans: [[{ 'name': 'Run away', 'options': { reacting: true } }
                , { 'name': 'Unpanic', 'options': {} }
                , { 'name': 'Go home', 'options': {} }]],
        },
        'tbp': {
            urgency: 1, plans: [[{ 'name': 'Go to base', 'options': { reacting: true } }
                , { 'name': 'Wait', 'options': { duration: 70000} }]],
        },
    },
    'Call the police': {
        'blue': {
            urgency: 1, plans: [[{ 'name': 'Go to specific location', 'options': { reacting: true } },
            { 'name': 'Wait', 'options': { 'duration': 1, reacting: true  } },
            { 'name': 'Go to work', 'options': {} },
            { 'name': 'Stay at police station', 'options': {} }]],
        },
    },
    'Interrogation': {
        'white': {
            urgency: 1, plans: [[{ 'name': 'Interrogation', 'options': { reacting: true } }]],
        },
        'red': {
            urgency: 1, plans: [[{ 'name': 'Interrogation', 'options': { reacting: true } }]],
        },
    },
    'Damage person': {
        'white': {
            urgency: 1, plans: [[{ 'name': 'Run away', 'options': { reacting: true } }]],
        },
        'red': {
            urgency: 1, plans: [[{ 'name': 'Run away', 'options': { reacting: true } }]],
        },
    },
    'Chaos': {
        'white': {
            urgency: 1, plans: [[{ 'name': 'Run away', 'options': { reacting: true } }],
                                [{ 'name': 'Hide', 'options': { reacting: true } }]],
        },
        'blue': {
            urgency: 2, plans: [[{ 'name': 'Go to specific location', 'options': { reacting: true } },
                { 'name': 'Release', 'options': {reacting: true} },
                { 'name': 'Search and attack', 'options': {reacting: true} }]],
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
    'Red eliminated': {
        'blue': {
            urgency: 1, plans: [[{ 'name': 'Go to base', 'options': { reacting: true } }]],
        },
    },

} as IReactions
