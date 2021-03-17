import { simController } from './sim-controller';
import { redisServices } from './services';

redisServices.flushDb().then(simController().then(() => console.log('Done')));
//simController().then(() => console.log('Done'));
