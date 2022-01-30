import axios from 'axios';
import { Coordinate } from 'osrm-rest-client';
import { IAgent, IAreaData, ILocation, IPopulatorConfig } from '../models';

export const populatorApi = (config: IPopulatorConfig) => {
  const { populatorURL = 'http://localhost:3333/', area = 'polygon' } = config;
  const populatorService = axios.create({ baseURL: populatorURL });
  return {
    retreiveProperties: async (type: string, coordinates: Number[] | Number[][][], radius?: Number) => {
      if (typeof area === 'undefined') {
        throw new Error('Populatorconfig area must be defined');
      }
      if (typeof area === 'string') {
        if (type === 'circular') {
          try {
            const response = await populatorService.post<any>('detailed', {
              body: {
                type: 'Feature',
                properties: {
                  shape: 'circular',
                  radius,
                },
                geometry: {
                  type: 'Point',
                  coordinates,
                },
              },
            });

            return response.data;
          } catch (error) {
            console.log(error);
            return false;
          }
        } else {
          try {
            const body = {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates,
              },
            };
            const response = await populatorService.post<any>('detailed', body);

            return response.data;
          } catch (error) {
            console.log(error);
            return false;
          }
        }
      }
    },
  };
};

export const populatorParser = (populatorData: IAreaData) => {
  const populatorWhiteAgents = [] as IAgent[];
  const housetypes: { [id: string]: ILocation } = {};

  let propertyCounter = {
    sport: 0,
    shop: 0,
    medical: 0,
    education: 0,
    work: 0,
  };
  let idNumber: number = 0;

  populatorData.features.map((item) => {
    item.properties.vbos?.features.map((item) => {
      const [lat, lon] = item.geometry.coordinates;
      const coord = [lat, lon] as Coordinate;

      item.properties.pop.map((item) => {
        const hh_size = item.hh_size;

        let parentAge: number = 0;
        let childAge: number = 0;
        switch (item.parents_age_group) {
          case '15-24':
            parentAge = Math.floor(Math.random() * (28 - 18)) + 18;
            childAge = Math.floor(Math.random() * (6 - 1)) + 1;
            break;
          case '25-44':
            parentAge = Math.floor(Math.random() * (44 - 29)) + 29;
            childAge = Math.floor(Math.random() * (12 - 6)) + 6;
            break;
          case '45-64':
            parentAge = Math.floor(Math.random() * (64 - 45)) + 45;
            childAge = Math.floor(Math.random() * (28 - 12)) + 12;
            break;
          case '65plus':
            parentAge = parentAge = Math.floor(Math.random() * (82 - 65)) + 65;
            childAge = parentAge = Math.floor(Math.random() * (35 - 28)) + 28;
            break;
        }

        if (item.household_type === 'single' || item.household_type === 'single parent') {
          const maleFemale = Math.random();
          const whiteparentAgent: IAgent = {
            id: 'burger' + idNumber,
            type: maleFemale < 1 ? 'man' : 'woman',
            status: 'active',
            actual: {
              type: 'home',
              coord,
            },
            occupations: [],
            age: parentAge,
            force: 'white',
            mailbox: [],
            sentbox: [],
            visibleForce: 'white',
            home: {
              type: 'home',
              coord,
            },
            health: 100,
            owns: [
              {
                type: 'bicycle',
                id: 'b' + idNumber,
              },
              {
                type: 'car',
                id: 'c' + idNumber,
              },
            ],
            baseLocation: '',
          };

          idNumber++;

          if (item.household_type === 'single parent') {
            const children = hh_size - 1;
            for (let i = 0; i < children; i++) {
              whiteparentAgent.relations?.push({ id: 'burger' + idNumber, type: 'child' });
              const maleFemale = Math.random();
              const child: IAgent = {
                id: 'burger' + idNumber,
                type: maleFemale < 1 ? 'man' : 'woman',
                status: 'active',
                actual: {
                  type: 'home',
                  coord,
                },
                occupations: [],
                age: childAge,
                health: 100,
                force: 'white',
                mailbox: [],
                sentbox: [],
                visibleForce: 'white',
                home: {
                  type: 'home',
                  coord,
                },

                relations: [{ id: whiteparentAgent.id, type: 'parent' }],
                owns: [
                  {
                    /** Type of object that the parentAgent owns, e.g. car or bicyle */
                    type: 'bicycle',
                    /** ID of the owned object */
                    id: 'b' + idNumber,
                  },
                ],
                baseLocation: '',
              };

              populatorWhiteAgents.push(child);
              idNumber++;
            }
          }
          populatorWhiteAgents.push(whiteparentAgent);
        } else if (
          item.household_type === 'couples with children' ||
          item.household_type === 'couples without children'
        ) {
          const children = hh_size - 2;

          const parent1: IAgent = {
            id: 'burger' + idNumber,
            type: 'man',
            status: 'active',
            actual: {
              type: 'home',
              coord,
            },
            occupations: [],
            force: 'white',
            mailbox: [],
            sentbox: [],
            age: parentAge,
            visibleForce: 'white',
            health: 100,
            home: {
              type: 'home',
              coord,
            },
            owns: [
              {
                /** Type of object that the parentAgent owns, e.g. car or bicyle */
                type: 'bicycle',
                /** ID of the owned object */
                id: 'b' + idNumber,
              },
              {
                /** Type of object that the parentAgent owns, e.g. car or bicyle */
                type: 'car',
                /** ID of the owned object */
                id: 'c' + idNumber,
              },
            ],
            baseLocation: '',
          };

          idNumber++;
          const parent2: IAgent = {
            id: 'burger' + idNumber,
            type: 'woman',
            status: 'active',
            actual: { type: 'home', coord },
            force: 'white',
            occupations: [],
            mailbox: [],
            sentbox: [],
            health: 100,
            visibleForce: 'white',
            age: parentAge,
            home: {
              type: 'home',
              coord,
            },
            owns: [
              {
                /** Type of object that the parentAgent owns, e.g. car or bicyle */
                type: 'bicycle',
                /** ID of the owned object */
                id: 'b' + idNumber,
              },
              {
                /** Type of object that the parentAgent owns, e.g. car or bicyle */
                type: 'car',
                /** ID of the owned object */
                id: 'c' + idNumber,
              },
            ],
            baseLocation: '',
          };
          parent1.relations?.push({ id: 'burger' + idNumber + 1, type: 'wife' });
          parent2.relations?.push({ id: 'burger' + idNumber, type: 'husband' });
          idNumber++;

          if (item.household_type === 'couples with children') {
            for (let i = 0; i < children; i++) {
              const maleFemale = Math.random();
              parent1.relations?.push({ id: 'burger' + idNumber, type: 'child' });
              parent2.relations?.push({ id: 'burger' + idNumber, type: 'child' });

              const child: IAgent = {
                id: 'burger' + idNumber,
                type: maleFemale < 1 ? 'man' : 'woman',
                status: 'active',
                actual: {
                  type: 'home',
                  coord,
                },

                occupations: [],
                force: 'white',
                mailbox: [],
                sentbox: [],
                health: 100,
                visibleForce: 'white',
                age: childAge,
                home: {
                  type: 'home',
                  coord,
                },
                relations: [
                  { id: parent1.id, type: 'parent' },
                  { id: parent2.id, type: 'parent' },
                ],
                owns: [
                  {
                    /** Type of object that the parentAgent owns, e.g. car or bicyle */
                    type: 'bicycle',
                    /** ID of the owned object */
                    id: 'b' + idNumber,
                  },
                ],
                baseLocation: '',
              };
              populatorWhiteAgents.push(child);
              idNumber++;
            }
            populatorWhiteAgents.push(parent1, parent2);
          }
        } else {
          null;
        }

        switch (item.func) {
          case 'winkelfunctie':
            let a = { type: 'shop', coord };
            housetypes['shop' + propertyCounter.shop] = a;
            propertyCounter.shop++;
            break;

          case 'industriefunctie' || 'kantoorfunctie':
            let b = { type: 'work', coord };
            housetypes['work' + propertyCounter.work] = b;
            propertyCounter.work++;
            break;

          case 'gezondheidszorgfunctie':
            let c = { type: 'medical', coord };
            housetypes['medical' + propertyCounter.medical] = c;
            propertyCounter.medical++;
            break;
          case 'onderwijsfunctie':
            let d = { type: 'learn', coord };
            housetypes['learn' + propertyCounter.education] = d;
            propertyCounter.education++;
            break;
          case 'sportfunctie':
            let e = { type: 'sport', coord };
            housetypes['sport' + propertyCounter.sport] = e;
            propertyCounter.sport++;
            break;
          default:
        }
      });
    });
  });

  populatorWhiteAgents.map((agent) => {
    agent.owns?.map((item) => {
      if (item.type === 'bicycle') {
        const bike: IAgent = {
          id: item.id,
          type: 'bicycle',
          status: 'active',
          actual: {
            type: 'home',
            coord: agent.home?.coord,
          },
          force: 'white',
          mailbox: [],
          sentbox: [],
          baseLocation: '',
          home: agent.home,
        };

        populatorWhiteAgents.push(bike);
      } else if (item.type === 'car') {
        let car: IAgent = {
          id: item!.id,
          type: 'car',
          status: 'active',
          actual: {
            type: 'home',
            coord: agent.home?.coord,
          },
          force: 'white',
          mailbox: [],
          sentbox: [],
          baseLocation: '',
          home: agent.home,
        };

        populatorWhiteAgents.push(car);
      }
    });
  });

  return { populatorWhiteAgents, housetypes };
};
