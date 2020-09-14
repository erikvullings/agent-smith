import { IProject } from "@csnext/cs-core";
import { AppState } from "@csnext/cs-client";
import { MapboxOptions } from 'mapbox-gl';
import {
    CsMap,
    MapOptions,
    MapLayers,
    ILayerServiceOptions} from '@csnext/cs-map';

 const SERVER_URL = process.env.VUE_APP_SERVER_URL ? process.env.VUE_APP_SERVER_URL : `${$cs.serverUrl()}/`; //'http://192.168.1.27:3008/'; //'http://localhost:3008/'; // : 'http://cool5.sensorlab.tno.nl:9099/';

export const project: IProject = {
    server: {
        useSocket: true,
        socketServerUrl: SERVER_URL
    },
    header: {
        hideToolbar: false,
        floating: false
    },
    navigation: {
        style: "tabs"        
    },
    datasources: {
        mainmap: new MapLayers(
            [
            ],
            undefined,
            [
                {
                    id: "event",
                    type: "layer-server-service",
                    options: { url: AppState.Instance.serverUrl() + '/', activeLayers: ['main'] } as ILayerServiceOptions
                }

            ]
        ),
    },
    leftSidebar: {        
        disabled: false,
        open: false,
        clipped: true
    },
    rightSidebar: {
        open: false,
        clipped: true,
        width: 480,
        closeButton: false     
    },
    dashboards: [
        {
            title: "Simulation",
            icon: "done_outline",
            path: "/",
            
            options: {
                navigation: 'tabs',
                closeRightSidebar: true,
                drawerTitle: 'Tasks'
            } as any, 
            widgets: [
                {
                    id: 'map',
                    component: CsMap,
                    datasource: 'mainmap',
                    options: {
                        background: true,
                        class: 'data-map-container',
                        token: process.env.VUE_APP_MAPBOX_TOKEN,
                        mbOptions: {
                            // style: 'http://localhost:4500/styles/klokantech-basic/style.json',
                            style: 'mapbox://styles/mapbox/streets-v9', //"http://localhost:901/styles/klokantech-basic/style.json", //"mapbox://styles/mapbox/streets-v9",
                            center: [4.799119, 52.478137],
                            zoom: 13
                        } as MapboxOptions,
                        showDraw: false,
                        showRuler: true,
                        showGrid: false,
                        showStyles: true,
                        showGeolocater: false,
                        showInfoWidget: true,
                        showFeatureDetails: false,                        
                        showGeocoder: false,
                        showTraffic: false,
                        showLayers: true,
                        showBuildings: false,                       
                    } as MapOptions
                }               
            ]
        }       
    ]
};
