import Vue from 'vue';
import { CsPlugin } from '@csnext/cs-client';
import { project } from './project';
import './assets/copper.css';

Vue.use(CsPlugin);
Vue.config.productionTip = false;
Vue.config.warnHandler = (msg, vm, trace) => {
  console.log(`Warn: ${msg}\nTrace: ${trace}`);
}

$cs.initApp('#app', project);


