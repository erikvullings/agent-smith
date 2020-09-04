import { Coordinate } from 'osrm-rest-client';

export interface ILocation {
  id: 'home' | 'work' | 'shop' | string;
  coord: Coordinate;
}
