
import { Module } from '@nestjs/common';
import { EventBus, CommandBus } from "@nestjs/cqrs";
import {
  LayerController,
  DefaultWebSocketGateway,
  LayerService,
  SourceController,
  FeatureController, LogService
} from '@csnext/cs-layer-server';
import * as path from 'path';
import { AppController } from './app.controller';
import { TestbedController } from './testbed/testbed.controller';
// import { TraccarController } from './traccar-controller';

@Module({
  imports: [ CommandBus ],
  controllers: [ AppController, LayerController, FeatureController, SourceController, TestbedController],
  providers: [ LogService, LayerService, DefaultWebSocketGateway]
})
export class ApplicationModule {
  readonly configFolder: string =
    process.env.LAYER_SERVER_CONFIG_FOLDER || './../../configs/layers/';

  constructor(private readonly layerService: LayerService) {
    const folder = path.join(__dirname, this.configFolder);
    console.log(
      `Initializing layer-server with configuration folder: ${folder}`
    );
    this.layerService.init('server.config.json', folder).then(r => {    
    })
    
  }
}
