import { Get, Controller, Inject, Logger as NestLogger, Post, Body } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DefaultWebSocketGateway, LayerService, ILogItem } from '@csnext/cs-layer-server';
import { TestBedAdapter, Logger, LogLevel, ITopicMetadataItem, IAdapterMessage, IDefaultKey, ITestBedOptions, IItem } from 'node-test-bed-adapter';
import { Feature, Point } from 'geojson';
import { LogService, LayerDefinition } from '@csnext/cs-layer-server';
import { OffsetFetchRequest } from 'kafka-node';
import _ from 'lodash';

const log = Logger.instance;
const SimEntityItemTopic = 'simulation_entity_item';

@Controller('testbed')
export class TestbedController {
    private adapter: TestBedAdapter;
    public config: ITestBedOptions = {} as ITestBedOptions;
    public messageQueue: IAdapterMessage[] = [];
    public busy = false;
    public layer: LayerDefinition;

    handleConnection(d: any) {
        // this.server.emit('buttonCount',AppService.buttonCount);
        console.log(`Timer connection received from ${d.id}`);
    }

    

    public createAdapter(): Promise<TestBedAdapter> {
        return new Promise(async (resolve, reject) => {
            console.log('Creating adapter');
            const host = process.env.KAFKA_HOST || 'localhost:3501';
            console.log(host);
            this.layer = await this.getEntityItemLayer('main');
            this.adapter = new TestBedAdapter({
                kafkaHost: host,
                schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
                clientId: 'copper',                
                consume: [{ topic: SimEntityItemTopic }],
                logging: {
                    logToConsole: LogLevel.Info,
                    logToKafka: LogLevel.Warn,
                },
            });
            this.adapter.on('error', (e) => console.error(e));
            this.adapter.on('message', (message : IAdapterMessage) => {
                this.messageQueue.push(message);
                this.handleMessage();                
            });
            this.adapter.on('ready', () => {
                console.log(`Current simulation time: ${this.adapter.simulationTime}`);
                console.log('Consumer is connected');
                resolve(this.adapter);
            });
            this.adapter.connect();
        })

    };

    constructor(
        @Inject('DefaultWebSocketGateway')
        private readonly socket: DefaultWebSocketGateway,
        public layers: LayerService,         
        public logs: LogService
    ) {
        NestLogger.log('Init testbed');
        this.createAdapter();        
    }

    private async handleMessage() {
        if (this.messageQueue.length > 0 && !this.busy) {
            this.busy = true;
            let message = this.messageQueue.shift();
            switch (message.topic) {
                case SimEntityItemTopic:
                    const entity = message.value as IItem;
                    
                    const feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [entity.location.longitude, entity.location.latitude, entity.location.altitude]
                        },
                        id: entity.id,
                        properties: { ...entity, ...{location: undefined}}
                    } as Feature;
                    
                    // console.log(feature);
                    this.layers.updateFeature(this.layer.id, feature).then(f => {
                        // console.log('updated');
                    }).catch(e => {
                        console.log('e');
                    })
                    
                    // console.log(entity.location.latitude);
                    // console.log('Sim Message');
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

    private async addMessage(message: IAdapterMessage) {
        this.messageQueue.push(message);
        this.handleMessage();
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
                def.tags = ['entity-item'];
                def.style = {
                    types: ['point'],
                    pointCircle: true
                };
                def._layerSource = {
                    id: id,
                    type: 'FeatureCollection',
                    features: []
                } as any; // LayerSource;

                // init layer
                this.layers
                    .initLayer(def)
                    .then(ld => {
                        // add layer
                        this.layers
                            .addLayer(ld)
                            .then(l => {
                                resolve(l);
                                return;
                            })
                            .catch(r => {
                                // could not add layer
                                reject(r);
                                return;
                            });
                    })
                    .catch(r => {
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
                elapsed: this.adapter.timeElapsed
            };
        } else {
            return {
                state: 'offline'
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