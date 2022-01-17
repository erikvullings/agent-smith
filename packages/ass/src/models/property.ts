export interface IPopulatorProperty {
  type: string;
  geometry: {
    type: string;
    coordinates: [[number, number][]];
  };
  properties: {
    id: string;
    sts: string;
    yr: number;
    ttl_ppl: number;
    vbos: {
      type: string;
      features: [
        {
          type: string;
          geometry: {
            type: string;
            coordinates: [number, number, number];
          };
          properties: {
            addr: number;
            sts: string;
            pop: [
              {
                parents_age_group: string;
                parent_count: number;
                ag_00_14: number;
                ag_15_24: number;
                ag_25_44: number;
                ag_45_64: number;
                ag_65_plus: number;
                hh_size: number;
                household_type: string;
                func: string;
              }
            ];
          };
        }
      ];
    };
  };
}

export interface IPropertyCollection {
  work: IProperty[];
  shop: IProperty[];
  healtcare: IProperty[];
  sport: IProperty[];
  education: IProperty[];
}

// export interface IPropertyCounter {
//   sport: number;
//   work: number;
//   healthcare: number;
// }

export interface IProperty {
  id: string;
  location: [number, number];
  type: string;
}
