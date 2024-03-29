import { Get, Controller, Logger as NestLogger } from '@nestjs/common';
import { LayerService } from '@csnext/cs-layer-server';
import { TestBedAdapter, LogLevel, IAdapterMessage, ITestBedOptions, IItem, IFeatureCollection } from 'node-test-bed-adapter';
import { Feature } from 'geojson';
import { LogService, LayerDefinition } from '@csnext/cs-layer-server';
import _ from 'lodash';
// import { IFeature } from 'test-bed-schemas/dist/standard/geojson/standard_geojson-value';

const SimEntityItemTopic = 'simulation_entity_item';
const SimEntityFeatureCollectionTopic = 'simulation_entity_featurecollection';
@Controller('testbed')
export class TestbedController {
    private adapter: TestBedAdapter;
    public config: ITestBedOptions = {} as ITestBedOptions;
    public messageQueue: IAdapterMessage[] = [];
    public busy = false;


    handleConnection(d: any) {
        // this.server.emit('buttonCount',AppService.buttonCount);
        console.log(`Timer connection received from ${d.id}`);
    }

    public createAdapter(): Promise<TestBedAdapter> {
        return new Promise(async (resolve) => {
            console.log('Creating adapter');
            const host = process.env.KAFKA_HOST || 'localhost:3501';
            console.log(host);
            this.adapter = new TestBedAdapter({
                kafkaHost: host,
                schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
                clientId: 'copper',
                consume: [{ topic: SimEntityItemTopic }, { topic: SimEntityFeatureCollectionTopic }],
                logging: {
                    logToConsole: LogLevel.Info,
                    logToKafka: LogLevel.Warn,
                },
            });
            this.adapter.on('error', (e) => console.error(e));
            this.adapter.on('message', (message: IAdapterMessage) => {
                this.messageQueue.push(message);
                this.handleMessage();
            });
            this.adapter.on('ready', () => {
                console.log(`Current simulation time: ${this.adapter.simulationTime}`);
                console.log('Consumer is connected');
                resolve(this.adapter);
            });
            this.adapter.connect();
        });
    }

    constructor(public layers: LayerService, public logs: LogService) {
        NestLogger.log('Init testbed');
        this.createAdapter();
    }

    private async handleMessage() {
        if (this.messageQueue.length > 0 && !this.busy) {
            this.busy = true;
            let message = this.messageQueue.shift();
            switch (message.topic) {
                case SimEntityFeatureCollectionTopic:                     
                    const collection = message.value as IFeatureCollection;
                    await this.updateFeatureCollection(collection);
                    break;
                case SimEntityItemTopic:
                    const entity = message.value as IItem;
                    await this.updateFeature(entity);

                    // console.log(entity.location.latitude);
                    // console.log('Sim Message');
                    break;
                default:
                    console.log(message.topic);
                    break;
            }

            // const stringify = (m: string | Object) => (typeof m === 'string' ? m : JSON.stringify(m, null, 2));
            // switch (message.topic) {
            //     case 'system_heartbeat':
            //         log.info(`Received heartbeat message with key ${stringify(message.key)}: ${stringify(message.value)}`);
            //         if (this.socket && this.socket.server) {
            //             this.socket.server.emit('time', this.getAdapterState());
            //         }
            //         break;
            //     case 'simulation_time_mgmt':
            //         log.info(`Received timing message with key ${stringify(message.key)}: ${stringify(message.value)}`);
            //         if (this.socket && this.socket.server) {
            //             this.socket.server.emit('time', this.getAdapterState());
            //         }
            //         break;
            //     case 'system_configuration':
            //         log.info(`Received configuration message with key ${stringify(message.key)}: ${stringify(message.value)}`);
            //         break;
            //     default:
            //         // find topic
            //         //   const topic = this.config.topics.find(t => t.id === message.topic);
            //         //   if (topic) {
            //         //     switch (topic.type) {
            //         //       case 'cap':
            //         //         // await this.parseCapObject(message.value as ICAPAlert);
            //         //         break;
            //         //       case 'geojson':
            //         //         await this.parseGeojson(topic.title, message, topic.tags);
            //         //         break;
            //         //       case 'geojson-external':
            //         //         await this.parseGeojsonExternal(topic.title, message, topic.tags);
            //         //         break;
            //         //       case 'geojson-data':
            //         //         await this.parseGeojsonData(topic.title, message, topic.tags);
            //         //         break;
            //         //       case 'request-unittransport':
            //         //         await this.parseRequestUnittransport(topic.title, message, topic.tags);
            //         //         break;
            //         //       case 'request-startinject':
            //         //         await this.parseRequestStartinject(topic.title, message, topic.tags);
            //         //         break;
            //         //       case 'entity-item':
            //         //         await this.parseEntityItem(topic.title, message, topic.tags);
            //         //         break;
            //         //       case 'affected-area':
            //         //         await this.parseAffectedArea(topic.title, message, topic.tags);
            //         //         break;
            //         //     }
            //         //   }

            //         // log.info(`Received ${message.topic} message with key ${stringify(message.key)}: ${stringify(message.value)}`);
            //         break;
            // }

            this.busy = false;
            this.handleMessage();
        }
    }

    private groupBy = <T, K extends keyof any>(list: T[], getKey: (item: T) => K) =>
    list.reduce((previous, currentItem) => {
        const group = getKey(currentItem);
        if (!previous[group]) previous[group] = [];
        previous[group].push(currentItem);
        return previous;
    }, {} as Record<K, T[]>);

    private async updateFeatureCollection(collection: IFeatureCollection)
    {
        const types = this.groupBy(collection.features, (i: any) => i.properties.type);
        for (const type in types) {
            if (Object.prototype.hasOwnProperty.call(types, type)) {
                const features = types[type];
                for (const feature of features) {
                    feature.geometry = feature.geometry['eu.driver.model.sim.support.geojson.geometry.Point'];                    

                    if (feature.properties.hasOwnProperty('tags')) {
                        for (const key in feature.properties.tags) {
                            if (Object.prototype.hasOwnProperty.call(feature.properties.tags, key)) {
                                const element = feature.properties.tags[key];
                                feature.properties[key] = element;
                                
                            }
                        }
                        delete feature.properties.tags;

                    }
                    
                }                
                let layer = await this.getEntityItemLayer(type);
                this.layers.updateAllFeatures(type, features);                
            }
        }
        console.log(`feature collection update at ${new Date().toISOString()} with ${collection.features.length} features`);        
    }

    private async updateFeature(entity: IItem)
    {
        if (entity.type)
        {
            // find layer                        
            let layer = await this.getEntityItemLayer(entity.type);
            const feature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [entity.location.longitude, entity.location.latitude, entity.location.altitude],
                },
                id: entity.id,
                properties: { ...entity, ...{ location: undefined } },
            } as Feature;

            // console.log(feature);
            this.layers
                .updateFeature(layer.id, feature)
                .then(() =>
                {
                    // console.log('updated');
                })
                .catch(() =>
                {
                    console.log('e');
                });
        }
    }

    private getEntityItemLayer(id: string): Promise<LayerDefinition> {
        return new Promise(async (resolve, reject) => {
            try {
                // try to get existing layer
                // console.log('Trying to get ' + id);
                let layer = await this.layers.getLayerById(id);
                resolve(layer);
                return;
            } catch (e) {
                console.log(e);
                console.log('not found ' + id);
                // layer not found, create new one
                const def = new LayerDefinition();
                def.title = id;
                def.id = id;
                def.isLive = true;
                def.sourceType = 'geojson';      
                def.source = id;                        
                def.tags = ['entity-item'];
                def.style = {
                    type: 'circle',
                    icon: `images/${id}.png`,
                    showSymbol: true,   
                    // clusterSettings: {
                    //     cluster: true,
                    //     clusterRadius: 500,
                    //     paint: {
                    //         "circle-color": "red"
                    //     }
                    // },                 
                    mapbox: {
                      circlePaint: {
                        "circle-radius": 20,
                        "circle-color": "gray"
                      },
                      symbolLayout: {
                        "icon-allow-overlap": true,
                        "icon-ignore-placement": true                        
                      }
                    },
                };

                def._layerSource = {
                    id: id,
                    type: 'FeatureCollection',
                    features: [],
                } as any; 

                // init layer
                this.layers
                    .initLayer(def)
                    .then((ld) => {
                        // add layer
                        this.layers
                            .addLayer(ld)
                            .then((l) => {
                                resolve(l);
                                return;
                            })
                            .catch((r) => {
                                // could not add layer
                                reject(r);
                                return;
                            });
                    })
                    .catch((r) => {
                        // could not init layer
                        reject(r);
                        return;
                    });
            }
        });
    }

    private getAdapterState(): any {
        if (this.adapter.isConnected) {
            return {
                time: this.adapter.simulationTime.getTime(),
                speed: this.adapter.simulationSpeed,
                state: this.adapter.timeState,
                elapsed: this.adapter.timeElapsed,
            };
        } else {
            return {
                state: 'offline',
            };
        }
    }

    @Get('state')
    root(): any {
        return this.getAdapterState();
    }

    @Get('version')
    version(): string {
        return 'v0.0.2';
    }
}
