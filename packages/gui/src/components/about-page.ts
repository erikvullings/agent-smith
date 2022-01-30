import m from 'mithril';
import { render } from 'slimdown-js';
import { Dashboards, MeiosisComponent } from '../services';

const md = `<h4 class="primary-text">About OST</h4>`;

export const AboutPage: MeiosisComponent = () => ({
  oninit: ({
    attrs: {
      actions: { setPage },
    },
  }) => setPage(Dashboards.ABOUT),
  view: () => m('.row', m.trust(render(md))),
});
