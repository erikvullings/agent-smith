import { ActivityList, CustomAgenda, CustomTypeAgenda, IActivityOptions, IAgent, IMail } from '../models';

import { simTime, hours, randomInRange, randomIntInRange, minutes } from '../utils';
import { IEnvServices, updateAgent } from '../env-services';
// import * as simConfig from '../sim_config.json';
import * as simConfig from '../verstoring_openbare_orde.json';
import { reaction } from '.';
import { customAgendas, customTypeAgendas } from '../sim-controller';

/**
 * @param agent
 * @param _services
 */
const getAgenda = (agent: IAgent, _services: IEnvServices) => {
  if (typeof agent._day === 'undefined') {
    agent._day = 0;
  } else {
    agent._day += 1;
  }
  const { _day: day } = agent;

  const activities = {
    work: () => [
      [
        {
          name: 'Go to work',
          options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 },
        },
        { name: 'Work', options: { duration: hours(3, 5), priority: 1 } },
        { name: 'Have lunch', options: { priority: 2 } },
        { name: 'Work', options: { duration: hours(3, 5), priority: 1 } },
      ],
      [
        {
          name: 'Go to work',
          options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 },
        },
        { name: 'Work', options: { duration: hours(3, 5), priority: 1 } },
      ],
      [
        {
          name: 'Go to work',
          options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 },
        },
        { name: 'Work', options: { duration: hours(3, 5), priority: 1 } },
      ],
    ],
    goHome: () => [{ name: 'Go home', options: { priority: 3 } }],
    shop: () => [
      [
        {
          name: 'Go shopping',
          options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 },
        },
        { name: 'Shop', options: { duration: hours(0, 1), priority: 2 } },
        { name: 'Go to other shops', options: { priority: 3 } },
      ],
      [
        {
          name: 'Go shopping',
          options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 },
        },
        { name: 'Shop', options: { duration: hours(0, 1), priority: 2 } },
      ],
    ],
    hangAroundArea: () => [
      { name: 'Go to specific area', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 3, areaCentre: [5.482012, 51.426585], areaRange: 100 } },
      { name: 'Hang around specific area', options: { duration: hours(0, 1), priority: 3, areaCentre: [5.482012, 51.426585], areaRange: 100 } },
    ],
    wander: () => [{ name: 'Wander', options: { priority: 3 } }],
    doctorVisit: () => [
      { name: 'Visit doctor', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'GetExamined', options: { duration: hours(0, 5) } },
    ],
    releaseAtRandomLocation: () => [
      { name: 'Go to random location', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'Release' },
    ],
    releaseRed: () => [
      { name: 'Release_red', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
    ],
    droneHangAround: () => [
      { name: 'Go to specific area', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 3, areaCentre: [4.892401, 52.373104], areaRange: 50 } },
      { name: 'Hang around specific area drone', options: { duration: hours(0, 1), priority: 3, areaCentre: [4.892401, 52.373104], areaRange: 50 } },
    ],
    droneDropObject: () => [
      { name: 'Go to specific area', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1, areaCentre: [4.892401, 52.373104], areaRange: 50 } },
      { name: 'Drop object', options: { priority: 1 } },
      { name: 'Hang around specific area drone', options: { duration: hours(0, 1), priority: 3, areaCentre: [4.892401, 52.373104], areaRange: 20 } },
    ],

  };

  const blueActivities = {
    goHome: () => [{ name: 'Go home', options: { priority: 3 } }],
    wander: () => [
      {
        name: 'Go to the park',
        options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 3 },
      },
      { name: 'Wander', options: { priority: 3 } },
    ],
    patrol: () => [
      [
        {
          name: 'Go to work',
          options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 },
        },
        { name: 'Patrol', options: { priority: 2 } },
        { name: 'Patrol', options: { priority: 2 } },
      ],
    ],
    guard: () => [
      [
        {
          name: 'Go to work',
          options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 },
        },
        { name: 'Guard', options: { duration: hours(3, 5), priority: 2 } },
      ],
      [
        {
          name: 'Go to work',
          options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 },
        },
        { name: 'Guard', options: { duration: hours(3, 5), priority: 2 } },
        { name: 'Have lunch', options: { priority: 2 } },
        { name: 'Guard', options: { duration: hours(3, 5), priority: 2 } },
      ],
    ],
    releaseAtRandomLocation: () => [
      { name: 'Go to random location', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'Release' },
    ],
  };

  const redActivities = {
    goHome: () => [{ name: 'Go home', options: { priority: 3 } }],
    dropAtRandomLocation: () => [
      { name: 'Go to random location', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) } },
      { name: 'Drop object', options: { priority: 1 } },
      { name: 'Run away', options: { priority: 1 } },
    ],
    dropAtSpecificLocation: () => [
      { name: 'Go to specific location', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), destination: { type: 'park', coord: [5.482012, 51.426585] } } },
      { name: 'Drop object', options: { priority: 1 } },
      { name: 'Run away', options: { priority: 1 } },
    ],
    stealFromShop: () => [
      {
        name: 'Go shopping',
        options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 2 },
      },
      { name: 'Shop', options: { duration: minutes(10), priority: 1 } },
      {
        name: 'Flee the scene',
        options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), priority: 1 },
      },
    ],
    fight: () => [
      { name: 'Fight', options: { startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)), duration: hours(3, 5) } },
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
      // [...redActivities['steal_from_shop'](), ...activities.goHome()] as ActivityList,
    ],
    group: () => [
      [...activities.releaseAtRandomLocation(), ...activities.goHome()] as ActivityList,
      // [...activities.release_red(),...activities.goHome()] as ActivityList,
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
    redActivity: () =>
       (agendaVariations['work']())[randomIntInRange(0,agendaVariations['work']().length-1)],
      //agendaVariations.red()[randomIntInRange(0, agendaVariations.red().length - 1)],
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
  else if(agent.following){

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
      if(agent.defenseType && agent.defenseType === 'kmar'){
        return agentAgendas.kmarDuty();
      }

        return agentAgendas.policeDuty();}
  default: {
      if (agent.occupations !== undefined && agent.occupations!.length !== 0) {
        return agentAgendas[agent.occupations![0].type as keyof typeof agentAgendas]();
      }
      return agentAgendas.work();

    }
  }

}

const customTypeAgenda = (agent: IAgent, _services: IEnvServices, customTypeAgIndex: number) => {
  if (typeof agent._day === 'undefined') {
    agent._day = 0;
  } else {
    agent._day += 1;
  }
  const { _day: day } = agent;

  const agenda = customTypeAgendas[customTypeAgIndex].agendaItems;
  if (agent.id == 'group3') {
    // console.log("customTypeAgendas group: ", customTypeAgendas[customTypeAgIndex]);
    // console.log("customTypeAgendas group: ", simConfig.customTypeAgendas[customTypeAgIndex]);
    // console.log(customTypeAgIndex);
    // console.log(agenda);
  }
  if (agenda.length > 0) {
    const agendaOptions = { ...(agenda[0].options), startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) };
    agenda[0].options = agendaOptions;
    return agenda as ActivityList;
  }
  return getAgenda(agent, _services);

};

const customAgenda = (agent: IAgent, _services: IEnvServices, customAgIndex: number) => {
  if (typeof agent._day === 'undefined') {
    agent._day = 0;
  } else {
    agent._day += 1;
  }
  const { _day: day } = agent;
  // const agenda2 = simConfig.customAgendas[customAgIndex].agendaItems;
  const agenda = customAgendas[customAgIndex].agendaItems;
  if (agenda.length > 0) {
    const agendaOptions = { ...(agenda[0].options), startTime: simTime(day, randomInRange(0, 4), randomInRange(0, 3)) };
    agenda[0].options = agendaOptions;
    return agenda as ActivityList;
  }

  return getAgenda(agent, _services);

};

/**
 * @param agent
 * @param services
 * @param mail
 */
const addReaction = async (agent: IAgent, services: IEnvServices, mail: IMail) => {
  agent.route = [];
  agent.steps = [];

  const timesim = services.getTime();
  timesim.setMinutes(timesim.getMinutes() + 6);

  if (agent.agenda && reaction[mail.message][agent.force] && reaction[mail.message][agent.force]!.plans.length > 0) {
    const reactionAgenda: ActivityList = reaction[mail.message][agent.force]!.plans[0];

    if (reactionAgenda[0].name === 'Go to specific location' || reactionAgenda[0].name === 'Follow person') {
      agent.destination = mail.location;

      reactionAgenda[0].options = { startTime: timesim, destination: mail.location, priority:1 };

      reactionAgenda.map((item) => item.options!.reacting = true);
    }
    else if (reactionAgenda[0].name === 'Run away') {
      reactionAgenda[0].options = { startTime: timesim, areaCentre: mail.location.coord };

      reactionAgenda.map((item) => item.options!.reacting = true);
    }
    else {
      reactionAgenda[0].options = { startTime: timesim, priority:1 };
      reactionAgenda.map((item) => item.options!.reacting = true);
    }

    agent.agenda = [...reactionAgenda, ...agent.agenda];

    // console.log('reaction agenda', agent.agenda);
    agent.reactedTo = mail.message;
    updateAgent(agent, services);
    // return reactionAgenda;
  }
}

export const agendas = {
  getAgenda,
  customAgenda,
  customTypeAgenda,
  addReaction,
}
