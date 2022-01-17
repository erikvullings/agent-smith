import { Coordinate } from 'osrm-rest-client';

export interface ILocation {
  type: 'home' | 'work' | 'shop' | 'medical' | 'park' | 'education' | 'learn' | string;

  coord: Coordinate;
}
