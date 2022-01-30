import m, { FactoryComponent } from 'mithril';
import Stream from 'mithril/stream';
import { merge } from '../utils/mergerino';
import { IContent } from '../models';
import {
  appStateMgmt,
  IAppStateActions,
  IAppStateModel,
  CollectionsActions,
  collectionFactory,
  CollectionsModel,
  CollectionType,
} from './states';
import { LoadDataEffect, LoginEffect } from './states/effects';

/*
 * For each item that you want to save in a separate collection:
 * - Create a collection name and add it to the CollectionNames type
 * - Create a collection using the collectionFactory
 * - Add the collection interfaces to the IAppModel and IActions interfaces
 * - Add the collections to the app constant
 */

/** Names of the collections */
export type CollectionNames = 'exercises' | 'users';

const exercisesCollection = collectionFactory<IContent>('exercises', ['id', 'name']);
const usersCollection = collectionFactory<IContent>('users', ['id', 'name']);

export interface IAppModel extends IAppStateModel, CollectionsModel<IContent> {
  exercises: CollectionType<IContent>;
  users: CollectionType<IContent>;
}

export interface IActions extends IAppStateActions, CollectionsActions<IContent> {}

export type ModelUpdateFunction = Partial<IAppModel> | ((model: Partial<IAppModel>) => Partial<IAppModel>);

export type UpdateStream = Stream<Partial<ModelUpdateFunction>>;

export type MeiosisComponent<T extends { [key: string]: any } = {}> = FactoryComponent<{
  state: IAppModel;
  actions: IActions;
  options?: T;
}>;

const runServices = (startingState: IAppModel) =>
  app.services.reduce(
    (state: IAppModel, service: (s: IAppModel) => Partial<IAppModel> | void) => merge(state, service(state)),
    startingState
  );

const app = {
  initial: Object.assign({}, appStateMgmt.initial, exercisesCollection.initial, usersCollection.initial) as IAppModel,
  actions: (update: UpdateStream, states: Stream<IAppModel>) =>
    Object.assign(
      {},
      appStateMgmt.actions(update, states),
      exercisesCollection.actions(update, states),
      usersCollection.actions(update, states)
    ) as IActions,
  /** Services update the state */
  services: [
    // (s) => console.log(s.app.page),
  ] as Array<(s: IAppModel) => Partial<IAppModel> | void>,
  effects: (_update: UpdateStream, actions: IActions) => [LoginEffect(actions), LoadDataEffect(actions)],
};

const update = Stream<ModelUpdateFunction>();
export const states = Stream.scan((state, patch) => runServices(merge(state, patch)), app.initial, update);
export const actions = app.actions(update, states);
const effects = app.effects(update, actions);

states.map((state) => {
  effects.forEach((effect) => effect(state));
  m.redraw();
});
