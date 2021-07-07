import { ActivityList, IAgent, IMail } from '../models';

import { hours, randomInRange, randomIntInRange, minutes, toTime, findWithAttr } from '../utils';
import { IEnvServices, updateAgent } from '../env-services';
import { reaction } from '.';
import { customAgendas, customTypeAgendas } from '../sim-controller';

/**
 * Returns an agenda based on the force of the agent
 *
 * @param {IAgent} agent
 * @param {IEnvServices} _services
 */
const getAgenda = (agent: IAgent, _services: IEnvServices) => {
  if (typeof agent.day === 'undefined') {
    agent.day = 0;
  } else {
    agent.day += 1;
  }

  const activities = {
    work: () => [
      [
        {
          name: 'Go to work',
          options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 3 },
        },
        { name: 'Work', options: { duration: hours(3, 5), priority: 3 } },
        { name: 'Have lunch', options: { priority: 2 } },
        { name: 'Work', options: { duration: hours(3, 5), priority: 3 } },
      ],
      [
        {
          name: 'Go to work',
          options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 3 },
        },
        { name: 'Work', options: { duration: hours(3, 5), priority: 3 } },
      ],
      [
        {
          name: 'Go to work',
          options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 3 },
        },
        { name: 'Work', options: { duration: hours(3, 5), priority: 3 } },
      ],
    ],
    goHome: () => [{ name: 'Go home', options: { priority: 3 } }],
    shop: () => [
      [
        {
          name: 'Go shopping',
          options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 3 },
        },
        { name: 'Shop', options: { duration: hours(0, 1), priority: 3 } },
        { name: 'Go to other shops', options: { priority: 3 } },
      ],
      [
        {
          name: 'Go shopping',
          options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 3 },
        },
        { name: 'Shop', options: { duration: hours(0, 1), priority: 3 } },
      ],
    ],
    hangAroundArea: () => [
      { name: 'Go to specific area', options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 3, areaCenter: [5.482012, 51.426585], areaRadius: 100 } },
      { name: 'Hang around specific area', options: { duration: hours(0, 1), priority: 3, areaCenter: [5.482012, 51.426585], areaRadius: 100 } },
    ],
    wander: () => [{ name: 'Wander', options: { priority: 3 } }],
    doctorVisit: () => [
      { name: 'Visit doctor', options: { priority: 3, startTime: (toTime(0, randomInRange(0, 15), 0, true)) } },
      { name: 'GetExamined', options: { duration: hours(0, 5) } },
    ],
    releaseAtRandomLocation: () => [
      { name: 'Go to random location', options: { priority: 1, startTime: (toTime(0, randomInRange(0, 15), 0, true)) } },
      { name: 'Release' },
    ],
    releaseRed: () => [
      { name: 'Release red', options: { priority: 1, startTime: (toTime(0, randomInRange(0, 15), 0, true)) } },
    ],
    droneHangAround: () => [
      { name: 'Go to specific area', options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 1, areaCenter: [4.892401, 52.373104], areaRadius: 50 } },
      { name: 'Hang around specific area drone', options: { duration: hours(0, 1), priority: 1, areaCenter: [4.892401, 52.373104], areaRadius: 50 } },
    ],
    droneDropObject: () => [
      { name: 'Go to specific area', options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 1, areaCenter: [4.892401, 52.373104], areaRadius: 50 } },
      { name: 'Drop object', options: { priority: 1 } },
      { name: 'Hang around specific area drone', options: { duration: hours(0, 1), priority: 1, areaCenter: [4.892401, 52.373104], areaRadius: 20 } },
    ],

  };

  const blueActivities = {
    goHome: () => [{ name: 'Go home', options: { priority: 3 } }],
    wander: () => [
      {
        name: 'Go to the park',
        options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 3 },
      },
      { name: 'Wander', options: { priority: 3 } },
    ],
    patrol: () => [
      [
        {
          name: 'Go to work',
          options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 2 },
        },
        { name: 'Patrol', options: { priority: 2 } },
        { name: 'Patrol', options: { priority: 2 } },
      ],
    ],
    guard: () => [
      [
        {
          name: 'Go to work',
          options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 2 },
        },
        { name: 'Guard', options: { duration: hours(3, 5), priority: 2 } },
      ],
      [
        {
          name: 'Go to work',
          options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 2 },
        },
        { name: 'Guard', options: { duration: hours(3, 5), priority: 2 } },
        { name: 'Have lunch', options: { priority: 2 } },
        { name: 'Guard', options: { duration: hours(3, 5), priority: 2 } },
      ],
    ],
    releaseAtRandomLocation: () => [
      { name: 'Go to random location', options: { priority: 2, startTime: (toTime(0, randomInRange(0, 15), 0, true)) } },
      { name: 'Release' },
    ],
  };

  const redActivities = {
    goHome: () => [{ name: 'Go home', options: { priority: 1 } }],
    dropAtRandomLocation: () => [
      { name: 'Go to random location', options: { priority: 1, startTime: (toTime(0, randomInRange(0, 15), 0, true)) } },
      { name: 'Drop object', options: { priority: 1 } },
      { name: 'Run away', options: { priority: 1 } },
    ],
    dropAtSpecificLocation: () => [
      { name: 'Go to specific location', options: { priority: 1, startTime: (toTime(0, randomInRange(0, 15), 0, true)), destination: { type: 'park', coord: [5.482012, 51.426585] } } },
      { name: 'Drop object', options: { priority: 1 } },
      { name: 'Run away', options: { priority: 1 } },
    ],
    stealFromShop: () => [
      {
        name: 'Go shopping',
        options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 2 },
      },
      { name: 'Shop', options: { duration: minutes(10), priority: 1 } },
      {
        name: 'Flee the scene',
        options: { startTime: (toTime(0, randomInRange(0, 15), 0, true)), priority: 1 },
      },
    ],
    fight: () => [
      { name: 'Fight', options: { priority: 1, startTime: (toTime(0, randomInRange(0, 15), 0, true)), duration: hours(3, 5) } },
    ],
  };

  const agendaVariations = {
    work: () => [
      [
        ...activities.work()[randomIntInRange(0, activities.work().length - 1)],
        ...activities.goHome(),
        ...activities.wander(),
        ...activities.goHome(),
      ] as ActivityList,
      [
        ...activities.work()[randomIntInRange(0, activities.work().length - 1)],
        ...activities.shop()[randomIntInRange(0, activities.shop().length - 1)],
        ...activities.goHome(),
        ...activities.wander(),
        ...activities.goHome(),
      ] as ActivityList,
      [
        ...activities.work()[randomIntInRange(0, activities.work().length - 1)],
        ...activities.shop()[randomIntInRange(0, activities.shop().length - 1)],
        ...activities.goHome(),
      ] as ActivityList,
      [
        ...activities.shop()[randomIntInRange(0, activities.shop().length - 1)],
        ...activities.work()[randomIntInRange(0, activities.work().length - 1)],
        ...activities.goHome(),
        ...activities.wander(),
        ...activities.goHome(),
      ] as ActivityList,
      [
        ...activities.shop()[randomIntInRange(0, activities.shop().length - 1)],
        ...activities.work()[randomIntInRange(0, activities.work().length - 1)],
        ...activities.goHome(),
      ] as ActivityList,
      [
        ...activities.shop()[randomIntInRange(0, activities.shop().length - 1)],
        ...activities.goHome(),
      ] as ActivityList,
      [
        ...activities.shop()[randomIntInRange(0, activities.shop().length - 1)],
        ...activities.wander(),
        ...activities.goHome(),
      ] as ActivityList,
      [
        ...activities.wander(),
        ...activities.shop()[randomIntInRange(0, activities.shop().length - 1)],
        ...activities.goHome(),
      ] as ActivityList,
      [
        ...activities.wander(),
        ...activities.work()[randomIntInRange(0, activities.work().length - 1)],
        ...activities.goHome(),
      ] as ActivityList,
    ],
    learn: () => [
      [
        ...activities.work()[randomIntInRange(0, activities.work().length - 1)],
        ...activities.wander(),
        ...activities.goHome(),
      ] as ActivityList,
    ],
    tourist: () => [
      [...activities.hangAroundArea(), ...activities.goHome()] as ActivityList,
    ],
    police: () => [
      [
        ...blueActivities.patrol()[randomIntInRange(0, blueActivities.patrol().length - 1)],
        ...activities.goHome(),
      ] as ActivityList,
    ],
    kmar: () => [
      [
        ...blueActivities.guard()[randomIntInRange(0, blueActivities.guard().length - 1)],
        ...activities.goHome(),
      ] as ActivityList,
    ],
    red: () => [
      [...redActivities.dropAtRandomLocation(), ...activities.goHome()] as ActivityList,
      [...redActivities.dropAtSpecificLocation(), ...activities.goHome()] as ActivityList,
    ],
    group: () => [
      [...activities.releaseAtRandomLocation(), ...activities.goHome()] as ActivityList,
    ],
    redGroup: () => [
      [...redActivities.fight(), ...activities.goHome()] as ActivityList,
    ],
    drone: () => [
      [...activities.droneHangAround(), ...activities.goHome()] as ActivityList,
      [...activities.droneDropObject(), ...activities.goHome()] as ActivityList,
    ],
    releaseAtLocation: () => [
      [...activities.releaseAtRandomLocation(), ...activities.goHome()] as ActivityList,
    ],
    null: () => [[...activities.wander(), ...activities.goHome()] as ActivityList],
  };

  const agentAgendas = {
    work: () => agendaVariations.work()[randomIntInRange(0, agendaVariations.work().length - 1)],
    learn: () => agendaVariations.learn()[randomIntInRange(0, agendaVariations.learn().length - 1)],
    releaseAtLocation: () => agendaVariations.releaseAtLocation()[0],
    policeDuty: () => agendaVariations.police()[randomIntInRange(0, agendaVariations.police().length - 1)],
    kmarDuty: () => agendaVariations.kmar()[randomIntInRange(0, agendaVariations.kmar().length - 1)],
    redActivity: () => agendaVariations.work()[randomIntInRange(0, agendaVariations.work().length - 1)],
    null: () => agendaVariations.null()[randomIntInRange(0, agendaVariations.null().length - 1)],
    tourist: () => (agendaVariations.tourist())[randomIntInRange(0, agendaVariations.tourist().length - 1)],
    group: () => (agendaVariations.group())[randomIntInRange(0, agendaVariations.group().length - 1)],
    redGroup: () => (agendaVariations.redGroup())[randomIntInRange(0, agendaVariations.redGroup().length - 1)],
    drone: () => (agendaVariations.drone())[randomIntInRange(0, agendaVariations.drone().length - 1)],
  };

  if (agent.type === 'group') {
    if (agent.force === 'red') {
      return agentAgendas.redGroup();
    }
    return agentAgendas.group();

  } if (agent.type === 'drone') {
    return agentAgendas.drone();
  }
  switch (agent.force) {
    case 'white': {
      if (agent.occupations !== undefined && agent.occupations!.length !== 0) {
        return agentAgendas[agent.occupations![0].type as keyof typeof agentAgendas]();
      }
      return agentAgendas.work();
    }
    case 'red': {
      return agentAgendas.redActivity();
    }
    case 'blue': {
      if (agent.defenseType && agent.defenseType === 'kmar') {
        return agentAgendas.kmarDuty();
      }

      return agentAgendas.policeDuty();
    }
    default: {
      if (agent.occupations !== undefined && agent.occupations!.length !== 0) {
        return agentAgendas[agent.occupations![0].type as keyof typeof agentAgendas]();
      }
      return agentAgendas.work();
    }
  }
}

/**
 * @param {IAgent} agent
 * @param {IEnvServices} services
 * @param {number} customTypeAgIndex index of the desired agenda in the list of custom type agendas
 * Gives the agent the custom agenda that belongs to the agent type and force
 */
const customTypeAgenda = (agent: IAgent, services: IEnvServices, customTypeAgIndex: number) => {
  if (typeof agent.day === 'undefined') {
    agent.day = 0;
  } else {
    agent.day += 1;
  }
  const agenda = [...customTypeAgendas[customTypeAgIndex].agendaItems];
  if (agenda.length > 0) {
    agenda[0].options = { ...agenda[0].options }
    if (!(agenda[0] && agenda[0].options && (agenda[0].options.startTime || agenda[0].options.endTime))) {
      const agendaOptions = { ...(agenda[0].options), startTime: '00:00:00r' };
      agenda[0].options = agendaOptions;
    }
    return agenda as ActivityList;
  }
  return getAgenda(agent, services);

};

/**
 * @param {IAgent} agent
 * @param {IEnvServices} services
 * @param {number} customAgIndex index of the desired agenda in the list of custom agendas
 * Gives the agent the custom agenda that belongs to the agent ID.
 */
const customAgenda = (agent: IAgent, services: IEnvServices, customAgIndex: number) => {
  if (typeof agent.day === 'undefined') {
    agent.day = 0;
  } else {
    agent.day += 1;
  }
  const agenda = [...customAgendas[customAgIndex].agendaItems];
  if (agenda.length > 0) {
    if (!(agenda[0] && agenda[0].options && (agenda[0].options.startTime || agenda[0].options.endTime))) {
      const agendaOptions = { ...(agenda[0].options), startTime: '00:00:00r' };
      agenda[0].options = agendaOptions;
    }
    return agenda as ActivityList;
  }
  return getAgenda(agent, services);

};

/**
 * Add a reaction to the agenda of the agent
 * Set the startTime in the options of the first agendaItem
 *
 * @param {IAgent} agent
 * @param {IEnvServices} services
 * @param {IMail} mail
 * @param {IAgent[]} agents
 */
const addReaction = async (agent: IAgent, services: IEnvServices, mail: IMail, agents: IAgent[]) => {
  agent.route = [];
  agent.steps = [];
  agent.reactedTo = mail.message;

  const timesim = services.getTime();
  timesim.setSeconds(timesim.getSeconds() + 1);
  const startTime = toTime(timesim.getHours(), timesim.getMinutes(), timesim.getSeconds());

  if (agent.agenda && reaction[mail.message][agent.force] && reaction[mail.message][agent.force]!.plans.length > 0) {
    const reactionAgenda: ActivityList = reaction[mail.message][agent.force]!.plans[0];
    if (reactionAgenda[0].name === 'Go to specific location') {
      agent.destination = mail.location;

      reactionAgenda[0].options = { startTime, destination: mail.location, priority: 1 };

      reactionAgenda.map((item) => item.options!.reacting = true);
    }
    else if (reactionAgenda[0].name === 'Go to base') {
      agent.destination = services.locations[agent.baseLocation];
      reactionAgenda[0].options = { startTime, destination: services.locations[agent.baseLocation], priority: 1 };

      if (agent.type === 'group' && agent.group && agent.group.length > 0 && agent.group[0].includes(agent.id)) {

        const filteredAgenda = reactionAgenda.filter(item => item.name !== 'Patrol' && item.name !== 'Release');
        const guardAgenda: ActivityList = [{ name: 'Guard', options: { duration: hours(3, 5), priority: 2 } }];
        const groupReacAgenda = [...filteredAgenda, ...guardAgenda];

        agent.agenda = [...groupReacAgenda];
        agent.reactedTo = mail.message;
        updateAgent(agent, services, agents);
        return true;
      }

      if (agent.type === 'man') {
        const filteredAgenda = reactionAgenda.filter(item => item.name !== 'Go to base' && item.name !== 'Release');
        agent.agenda = [...filteredAgenda];
        agent.reactedTo = mail.message;
        updateAgent(agent, services, agents);
        return true;
      }
      reactionAgenda.map((item) => item.options!.reacting = true);

      agent.agenda = [...reactionAgenda];
    }

    else if (reactionAgenda[0].name === 'Follow person' || reactionAgenda[0].name === 'Walk to person') {

      agent.following = mail.sender.id;
      agent.destination = mail.location;
      reactionAgenda[0].options = { startTime, destination: mail.location, priority: 1 };

      reactionAgenda.map((item) => item.options!.reacting = true);

    }
    else if (reactionAgenda[0].name === 'Damage person' || reactionAgenda[0].name === 'Search and attack') {
      const index = await findWithAttr(agent.agenda, 'name', 'Release');
      if (agent.agenda[0].name === 'Release') {
        agent.target = mail.sender;
        reactionAgenda[0].options = { startTime, destination: mail.location, priority: 1 };
        const updatedOldAgenda = agent.agenda.slice(1);
        const releaseAgenda = agent.agenda.slice(0, index)
        agent.agenda = [...releaseAgenda, ...reactionAgenda, ...updatedOldAgenda];

        agent.reactedTo = mail.message;
        updateAgent(agent, services, agents);
        return true;
      }

      agent.target = mail.sender;
      reactionAgenda[0].options = { startTime, destination: mail.location, priority: 1 };

      reactionAgenda.map((item) => item.options!.reacting = true);

    }
    else if (reactionAgenda[0].name === 'Run away') {
      reactionAgenda[0].options = { startTime, areaCenter: mail.location.coord, areaRadius: mail.runDistance };

      reactionAgenda.map((item) => item.options!.reacting = true);
    }
    else {
      reactionAgenda[0].options = { startTime, priority: 1 };
      reactionAgenda.map((item) => item.options!.reacting = true);
    }

    agent.agenda = [...reactionAgenda, ...agent.agenda];

    agent.reactedTo = mail.message;
    updateAgent(agent, services, agents);
    return true;
  }
  return false;
}

export const agendas = {
  getAgenda,
  customAgenda,
  customTypeAgenda,
  addReaction,
}
