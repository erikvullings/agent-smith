// import { traccar } from './traccar-controller';
import { NestServer } from '@csnext/cs-layer-server';
import { ApplicationModule } from './app.module';
import { join } from 'path';
import { Logger } from '@nestjs/common';

const port = process.env.SERVER_PORT || '3008';
const server = new NestServer();

server.config = {
  staticFolder: join(process.cwd(), process.env.DASHBOARD_BUILD ? process.env.DASHBOARD_BUILD : 'dist/dashboard'),
  staticPath: '/dashboard',
  openApi: true,
  cors: true,  
  basicAuth: {
    enabled: false,
    challenge: true,
    users: {
      'arnoud': 'arnoud'
    }
  }
};

Logger.log('Copper server', 'Server');
 
server.bootstrap(ApplicationModule, 'copper-server', '0.0.0.0', Number.parseInt(port)).then(async ()=>{   
 
});
