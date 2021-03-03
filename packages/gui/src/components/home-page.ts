import m from 'mithril';
import { Dashboards, MeiosisComponent } from '../services';

export const HomePage: MeiosisComponent = () => {
  return {
    oninit: async ({
      attrs: {
        actions: { setPage },
      },
    }) => {
      setPage(Dashboards.HOME);
    },
    view: ({ attrs: { state } }) => {
      console.log(state);

      return m('.home-page', [m('div', 'HOMEPAGE')]);
    },
  };
};
