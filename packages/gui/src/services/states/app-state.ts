import Stream from 'mithril/stream';
import { Dashboards, dashboardSvc } from '..';
import { Auth } from '../login-service';
import { actions, IAppModel, UpdateStream } from '../meiosis';
/** Application state */

const userIdKey = 'userid';

export interface IAppStateModel {
  app: {
    apiService: string;
    isSearching: boolean;
    searchQuery?: string;
    page?: Dashboards;
    /** Logged in user */
    loggedInUser?: string;
  };
}

export interface IAppStateActions {
  setPage: (page: Dashboards) => void;
  update: (model: Partial<IAppModel>) => void;
  search: (isSearching: boolean, searchQuery?: string) => void;
  changePage: (
    page: Dashboards,
    params?: { [key: string]: string | number | undefined },
    query?: { [key: string]: string | number | undefined }
  ) => void;
  login: (loggedInUser?: string) => Promise<void>;
  logout: () => void;
}

export interface IAppState {
  initial: IAppStateModel;
  actions: (us: UpdateStream, states: Stream<IAppModel>) => IAppStateActions;
}

console.log(`API server: ${process.env.SERVER}`);

export const appStateMgmt = {
  initial: {
    app: {
      /** During development, use this URL to access the server. */
      apiService: process.env.SERVER || window.location.origin,
      isSearching: false,
      searchQuery: '',
    },
  },
  actions: (update, _states) => {
    return {
      setPage: (page: Dashboards) => update({ app: { page } }),
      update: (model: Partial<IAppModel>) => update(model),
      search: (isSearching: boolean, searchQuery?: string) => update({ app: { isSearching, searchQuery } }),
      changePage: (page, params, query) => {
        dashboardSvc.switchTo(page, params, query);
        update({ app: { page } });
      },
      login: async (loggedInUser?: string) => {
        Auth.setUsername('Dummy');
        Auth.setRoles(['admin']);
        update({ app: { loggedInUser: { id: 1, name: 'Dummy' } } });
        // if (!loggedInUser) {
        //   const uid = localStorage.getItem(userIdKey);
        //   if (!uid) return;
        //   loggedInUser = uid;
        // }
        // if (typeof loggedInUser === 'string') {
        //   const user = await actions.users.load(loggedInUser);
        //   user && localStorage.setItem(userIdKey, loggedInUser);
        //   Auth.isAuthenticated = user ? true : false;
        //   update({ app: { loggedInUser: user } });
        // } else {
        //   Auth.isAuthenticated = true;
        //   update({ app: { loggedInUser } });
        // }
      },
      logout: () => {
        localStorage.removeItem(userIdKey);
        Auth.isAuthenticated = false;
        update({ app: { loggedInUser: undefined } });
      },
    };
  },
} as IAppState;
