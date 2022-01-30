import { Feature, FeatureCollection, Point, Polygon } from '@turf/helpers';

export interface IPopulatorConfig {
  area:
    | Array<[longitude: number, latitude: number]>
    | string
    | FeatureCollection<Polygon | Point>
    | Feature<Polygon | Point>;
  populatorURL?: string;
  debug?: boolean;
}
