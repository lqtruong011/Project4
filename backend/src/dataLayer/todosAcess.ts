import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import * as uuid from 'uuid'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly createdAtIndex = process.env.TODOS_CREATED_AT_INDEX,
        private readonly signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly s3Bucket = new XAWS.S3({
            signatureVersion: 'v4'
        })
    ) { }

    async createTodosAccess(newTodo: TodoItem): Promise<TodoItem> {
        logger.info('Create new TodoItem for userId ' + newTodo.userId + ' name ' + newTodo.name)
        try {
            await this.docClient.put({
                TableName: this.todosTable,
                Item: newTodo
            }).promise()
        } catch (err) {
            logger.error('Cannot create ToDo', {
                methodName: 'todosAccess.insertTodoItem',
                todoId: newTodo.todoId,
                error: err
            })
            return err
        }
        return newTodo
    }

    async getTodo(userId: string): Promise<any> {
        logger.info('Get todo by id ' + userId)
        const params = {
            TableName: this.todosTable,
            IndexName: this.createdAtIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }
        const todos = await this.docClient.query(params).promise()
        return todos
    }

    async updateTodo(userId: string, todoId: string, updatedTodo: TodoUpdate): Promise<TodoUpdate> {
        logger.info('Update todo by userId ' + userId + ' todoId ' + todoId)
        const params = {
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: 'set #name=:name, #dueDate=:dueDate, #done=:done',
            ExpressionAttributeNames: { '#name': 'name', '#dueDate': 'dueDate', '#done': 'done' },
            ExpressionAttributeValues: {
                ':name': updatedTodo.name,
                ':dueDate': updatedTodo.dueDate,
                ':done': updatedTodo.done
            }
        }
        await this.docClient.update(params).promise()
        return updatedTodo
    }

    async deleteTodoItem(userId: string, todoId: string) {
        logger.info('Delete todos by userId ' + userId + ' todoId ' + todoId)
        const params = {
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            }
        }
        return await this.docClient.delete(params).promise()
    }

    getSignedURL(todoId: string) {
        const params = {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: Number(this.signedUrlExpiration)
        }
        return this.s3Bucket.getSignedUrl('putObject', params)
    }

    async createAttachmentPresignedUrl(userId: string, todoId: string): Promise<any> {
        const imageId = uuid.v4();
        const signedUrl = this.getSignedURL(imageId)
        logger.info(`SighedUrl from s3 bucket: ${signedUrl}`)
        logger.info('Create signed url for user id ' + userId + ' todoId ' + todoId)
        const params = {
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "set attachmentUrl=:url",
            ExpressionAttributeValues: {
                ':url': `https://${process.env.ATTACHMENT_S3_BUCKET}.s3.amazonaws.com/${imageId}`
            }
        }
        await this.docClient.update(params).promise()
        return signedUrl
    }
}
