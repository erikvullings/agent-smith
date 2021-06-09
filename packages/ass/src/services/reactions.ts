import { IReactions } from '../models';


export const reaction = {

    'Walk to person': {
        'white': {
            urgency: 1, plans: [[{ 'name': 'Walk to person', 'options': {reacting: true} }]],
        },
    },
    'Wait for person': {
        'white': {
            urgency: 2, plans: [[{ 'name': 'Wait', 'options': {reacting: true} }]],
        },
    },
    'Chat': {
        'white': {
            urgency: 2, plans: [[{ 'name': 'Chat', 'options': {reacting: true} }]],
        },
    },
} as IReactions
