import { ActivityList } from './plan';

export interface IReactions {
  [key: string]: IReactionObject;
}

export interface IReactionObject {
  blue?: IReact;
  red?: IReact;
  white?: IReact;
  vip?: IReact;
}

export interface IReact {
  urgency: number;
  plans: ActivityList[];
}

export interface IPlanEffects {
  [key: string]: IPlanEffectObject;
}

export interface IPlanEffectObject {
  damageRadius: number;
  damageLevel: number;
  damageCount?: number;
  runDistance?: number;
  panicLevel: number;
  delayLevel: number;
  delayCause?: string;
  severity: 1 | 2 | 3 | 4 | 5;
  messageRadius: number;
}