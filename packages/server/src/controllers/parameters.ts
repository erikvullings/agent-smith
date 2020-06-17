import { BaseContext } from 'koa';
import { description, request, summary, tagsAll } from 'koa-swagger-decorator';

@tagsAll(['Parameters'])
export default class ParameterController {
  @request('get', '/parameters')
  @summary('The model parameters that you can supply and which you must match.')
  @description(
    `A JSON (or JSOG) description of the parameters you can set and their range in the 'bounds' property,
     and a 'match' property containing the real-word properties that need to match.`
  )
  public static async modelParameters(ctx: BaseContext): Promise<void> {
    ctx.body = JSON.stringify({ model: 'undefined' }, null, 2);
  }
}
