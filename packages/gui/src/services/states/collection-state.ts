import { CollectionNames, IAppModel, UpdateStream } from '../meiosis';
import { IContent } from '../../models';
import { restServiceFactory } from '../rest-service';
import Stream from 'mithril/stream';

export type CollectionItemMode = 'view' | 'edit' | 'loading';

export type CollectionType<T extends IContent> = {
  section?: string;
  current?: Partial<T>;
  list?: Partial<T>[];
};

export type CollectionsModel<T extends IContent> = Record<CollectionNames, CollectionType<T>>;

/** Actions that can be invoked on each collection */
export type CollectionActions<T extends IContent> = {
  /** Set the current active item */
  setCurrent: <U>(current: U) => void;
  /** Get a list of all the active (?) items */
  updateList: () => Promise<void>;
  /** Select an item */
  load: (id: string) => Promise<T>;
  /** Create an item */
  create: (item: Partial<T>, callback?: (current: Partial<T>) => void) => Promise<void>; // | T;
  /** Save an item */
  save: (item: Partial<T>, callback?: (current: Partial<T>) => void) => Promise<void>; // | T;
  /** Delete an item */
  del: (id: string) => Promise<void>;
  /** Change section */
  changeSection: (sectionId: string) => void;
};

/** All actions that can be invoked per collection */
export type CollectionsActions<T extends IContent> = Record<CollectionNames, CollectionActions<T>>;

export interface ICollectionState<T extends IContent> {
  initial: CollectionsModel<T>;
  actions: (us: UpdateStream, states: Stream<IAppModel>) => CollectionsActions<T>;
}

export const collectionFactory = <T extends IContent>(
  collectionName: CollectionNames,
  viewProps?: string[]
) => {
  const restSvc = restServiceFactory<T>(collectionName);

  return {
    initial: {
      [collectionName]: {
        mode: undefined,
        current: undefined,
        list: [] as T[],
      } as CollectionType<T>,
    } as CollectionsModel<T>,
    actions: (us, states) => {
      return {
        [collectionName]: {
          setCurrent: (current: Partial<T>) => {
            const cur = states()[collectionName].current;
            if (cur && current && cur.id === current.id) return;
            // console.log('Updating current user');
            us({ [collectionName]: { current: () => current } });
          },
          updateList: async () => {
            const state = states();
            const { list: l } = state[collectionName];
            if (l && l.length > 0) return;
            const list = await restSvc.loadFilteredList(viewProps);
            us({ [collectionName]: { list } });
          },
          load: async (id) => {
            const current = await restSvc.load(id);
            if (current) {
              us({ [collectionName]: { current: () => current } });
            }
            return current;
          },
          create: async (item, callback?: (current: Partial<T>) => void) => {
            // const state = states();
            // const old = state[collectionName].current as { [key: string]: any };
            // if (old) {
            //   Object.keys(old).forEach((k) => (old[k] = undefined));
            // }
            const current = await restSvc.save(item);
            if (current) {
              // const state = states();
              // const list = state[collectionName].list as T[];
              // list.push(current);
              console.table(current);
              us({ [collectionName]: { current: () => current } });
              // us({ [collectionName]: { current: old }, [collectionName]: { current } });
              callback && callback(current);
            }
          },
          save: async (item, callback?: (current: Partial<T>) => void) => {
            const current = await restSvc.save(item);
            if (current) {
              // const state = states();
              // const list = state[collectionName].list as T[];
              // list.push(current);
              console.table(current);
              us({ [collectionName]: { current: () => current } });
              callback && callback(current);
            }
          },
          del: async (id) => {
            await restSvc.del(id);
            us({ [collectionName]: { current: undefined } });
          },
          changeSection: (section: string) => us({ [collectionName]: { section } }),
        } as CollectionActions<T>,
      } as CollectionsActions<T>;
    },
  } as ICollectionState<T>;
};
