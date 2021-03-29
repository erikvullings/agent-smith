import m from 'mithril';
import { Dashboards, MeiosisComponent } from '../services';

export const Dsl: MeiosisComponent = () => {
  return {
    oninit: async ({
      attrs: {
        actions: { setPage },
      },
    }) => {
      setPage(Dashboards.DSL);
    },
    view: ({ attrs: { state } }) => {
      console.log(state);
        return m("dsl", [
            m("label", "DSL page"),
            m("button", "A button"),

        ])

      //return m('.home-page', m('div', 'HOMEPAGE'));
    },
  };
};
