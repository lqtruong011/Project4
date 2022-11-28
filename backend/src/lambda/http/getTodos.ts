import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let page:any = getParams(event, 'page');

    const todos = await getTodosForUser(getUserId(event), page)
    return {
      statusCode: 200,
      body: JSON.stringify({todos})
    }
  }
)

export function getParams(event: APIGatewayProxyEvent, paramName: string) {
  const pathVariable = event.pathParameters
  if (pathVariable) {
    return pathVariable[paramName]
  }
  return undefined
}

handler.use(
  cors({
    credentials: true
  })
)
