/* eslint-disable camelcase */
export interface IAreaData {
    type: string;
    features: {
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
                features: [{
                    type: string;
                    geometry: {
                        type: string;
                        coordinates: [number, number, number];
                    };
                    properties: {
                        addr: number;
                        sts: string;
                        pop: [{
                            parents_age_group: string;
                            parent_count: number;
                            ag_00_14: number;
                            ag_15_24: number;
                            ag_25_44: number;
                            ag_45_64: number;
                            ag_65_plus: number;
                            hh_size: number;
                            househould_type: string;
                            func: string;
                        }];
                    };
                }];
            };
        };
    }[];
}