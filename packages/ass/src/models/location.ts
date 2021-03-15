import { Coordinate } from 'osrm-rest-client';

export interface ILocation {
  type: 'home' | 'work' | 'shop' | 'medical' | 'park' | string;
  coord: Coordinate;
}
