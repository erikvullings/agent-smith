import {Module, Logger} from '@nestjs/common';
import {TestbedController} from './testbed.controller';

@Module({
  imports: [
    
  ],
  controllers: [TestbedController],
})
export class TimeModule {

  constructor() {
    Logger.log(`Initializing test-bed`);    
  }
}