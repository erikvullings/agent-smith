import m from 'mithril';
import { IContent } from '../models';

const log = console.log;
const error = console.error;

const createRestServiceFactory = () => {
  return <T extends IContent>(urlFragment: string) => {
    const url = `${process.env.SERVER}/api/${urlFragment}/`;
    const withCredentials = false;

    const create = async (item: Partial<T>, fd?: FormData) => {
      try {
        return await m.request<T>({
          method: 'POST',
          url,
          body: fd || item,
          withCredentials,
        });
      } catch (err) {
        return error(err.message);
      }
    };

    const update = async (item: Partial<T>, fd?: FormData) => {
      try {
        console.debug('put');
        return await m
          .request<T>({
            method: 'PUT',
            url: url + item.$loki,
            body: fd || item,
            withCredentials,
          })
          .catch((e) => console.error(e));
      } catch (err) {
        return error(err.message);
      }
    };

    const save = (item: Partial<T>, fd?: FormData) =>
      item.$loki ? update(item, fd) : create(item, fd);

    const del = async (id: string | number) => {
      try {
        await m.request<T>({
          method: 'DELETE',
          url: `${url}/id/${id}`,
          withCredentials,
        });
        log(`Deleted with id: ${id}.`);
      } catch (err) {
        return error(err.message);
      }
    };

    const load = (id: string | number) =>
      m.request<T>({
        background: true,
        method: 'GET',
        url: `${url}id/${id}`,
        withCredentials,
      });

    const loadList = async () => {
      const result = await m.request<T[]>({
        background: true,
        method: 'GET',
        url,
        withCredentials,
      });
      if (!result) {
        console.warn(`No result found at ${url}`);
      }
      return result;
    };

    const loadFilteredList = async (props?: string[]) => {
      if (!props) return loadList();
      const filter = 'view?props=' + props.join(',');
      const result = await m.request<T[]>({
        background: true,
        method: 'GET',
        url: url + filter,
        withCredentials,
      });
      if (!result) {
        console.warn(`No result found at ${url}`);
      }
      return result;
    };

    return {
      create,
      update,
      save,
      del,
      load,
      loadList,
      loadFilteredList,
    };
  };
};

export const restServiceFactory = createRestServiceFactory();
