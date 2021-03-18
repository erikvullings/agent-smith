import { ComponentTypes } from 'mithril';
import { Dashboards } from '../services';

export type IconType = () => string | string;

export type IconResolver = () => string;

export interface IDashboard {
  id: Dashboards;
  default?: boolean;
  hasNavBar?: boolean;
  title: string | (() => string);
  icon: string | IconResolver;
  route: string;
  visible: boolean;
  component: ComponentTypes<any, any>;
}
