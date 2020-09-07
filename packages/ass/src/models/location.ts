import { Coordinate } from 'osrm-rest-client';

export interface ILocation {
  type: 'home' | 'work' | 'shop' | 'medical' | string;
  coord: Coordinate;
}
