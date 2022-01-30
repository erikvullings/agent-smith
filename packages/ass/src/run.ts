import { simController } from './sim-controller';
import { redisServices } from './services';

redisServices.flushDb();
simController().then(() => console.log('Done'));
