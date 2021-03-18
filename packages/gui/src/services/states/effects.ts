import { Auth } from '../login-service';
import { IActions, IAppModel } from '../meiosis';

let loggedIn = false;

export const LoadDataEffect = (actions: IActions) => {
  let dataLoaded = false;

  return async (state: IAppModel) => {
    const { users } = state;
    const todo = [] as Promise<void>[];
    // console.log('EFFECT');
    if (!dataLoaded && (!users.list || users.list.length === 0)) {
      dataLoaded = true;
      console.log(`Loading data`);
      // todo.push(actions.users.updateList());
      // todo.push(actions.exercises.updateList());
      // await Promise.all(todo);
    }
  };
};

export const LoginEffect = (actions: IActions) => async (state: IAppModel) => {
  if (!loggedIn && !state.app.loggedInUser) {
    console.log(`Logging in`);
    loggedIn = true;
    await actions.login();
  } else if (loggedIn && state.app.loggedInUser) {
  }
};
