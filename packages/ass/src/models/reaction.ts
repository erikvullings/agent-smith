import { ActivityList } from "./plan";

export interface IReactions {
  [key: string]: IReactionObject;
}

export interface IReactionObject {
  blue?: IReact;
  red?: IReact;
  white?: IReact;
}

export interface IReact {
  urgency: number;
  plans: Array<ActivityList>;
}
