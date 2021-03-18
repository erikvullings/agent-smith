// import Keycloak, { KeycloakError, KeycloakInstance } from 'keycloak-js';
import m from 'mithril';
import { Dashboards } from '.';
import { IContent } from '../models';
import { Roles } from '../models/roles';
import { MeiosisComponent } from './meiosis';

const userId = 'userid';
const userRole = 'userrole';

export const Auth = {
  username: localStorage.getItem(userId) || '',
  roles: (localStorage.getItem(userRole) || 'user').split(','),
  isAuthenticated: false,

  isLoggedIn() {
    // console.table(Auth);
    return (
      typeof Auth.username !== 'undefined' &&
      Auth.username.length > 0 &&
      Auth.roles &&
      Auth.roles.length > 0 &&
      Auth.roles[0].length > 0
    );
  },
  /** Can edit all documents, (un-)publish them, but also change the persons that have access. */
  isAdmin() {
    return Auth.roles.indexOf(Roles.ADMIN) >= 0;
  },
  /** Can edit all documents, (un-)publish them. */
  isEditor() {
    return Auth.roles.indexOf(Roles.EDITOR) >= 0 || Auth.roles.indexOf(Roles.ADMIN) >= 0;
  },
  /** Can edit the document, but also change the persons that have access. */
  isOwner(doc: Partial<IContent>) {
    return (
      Auth.isAdmin() ||
      (Auth.isAuthenticated && doc.author && doc.author.indexOf(Auth.username) >= 0)
    );
  },
  /** Can edit the document, but also change the persons that have access. */
  canCRUD(doc: Partial<IContent>) {
    return Auth.isAuthenticated && (Auth.isAdmin() || Auth.isOwner(doc));
  },
  /** Can edit the document and publish it. */
  canEdit(doc: Partial<IContent>) {
    return Auth.isAuthenticated && (Auth.canCRUD(doc) || Auth.isEditor());
  },
  setUsername(username: string) {
    Auth.username = username;
    localStorage.setItem(userId, username);
    Auth.login();
  },
  setRoles(roles: Array<string | number>) {
    Auth.roles = roles as string[];
    localStorage.setItem(userRole, roles.join(','));
    Auth.login();
  },
  setAuthenticated(authN: boolean) {
    Auth.isAuthenticated = authN;
  },
  async login() {
    Auth.isAuthenticated = Auth.isLoggedIn();
  },
  logout() {
    Auth.setAuthenticated(false);
    Auth.setUsername('');
    Auth.setRoles([]);
    m.route.set('/');
  },
};

Auth.login();
(window as any).Auth = Auth;

export const Login: MeiosisComponent = () => {
  return {
    oninit: ({
      attrs: {
        actions: { setPage },
      },
    }) => setPage(Dashboards.LOGIN),
    view: () => {
      return m('.row', 'Login');
    },
  };
};
