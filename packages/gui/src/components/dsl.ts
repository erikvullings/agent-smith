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
        return m("main", [
            m("h4", {class: "title"}, "DSL editor"),
            m("label", "DSL page"),
            
        ])

      //return m('.home-page', m('div', 'HOMEPAGE'));
    },
  };
};
