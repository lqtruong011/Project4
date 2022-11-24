import { TodosAccess } from '../dataLayer/todosAcess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('Todos')

const todosAccess = new TodosAccess()

// TODO: Implement businessLogic
export async function createTodo(newTodo: CreateTodoRequest, userId: string) {
    logger.info(`Create new Todo: ${newTodo.name}`)
    const todoId = uuid.v4()
    const newItem = {
        userId: userId,
        todoId: todoId,
        createdAt: new Date().toISOString(),
        done: false,
        ...newTodo
    }
    return await todosAccess.createTodosAccess(newItem)
}

export async function getTodosForUser(userId: string) {
    logger.info(`User id: ${userId}`)
    return await todosAccess.getTodo(userId)
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest) {
    logger.info(`User id: ${userId}, Todo id: ${todoId}`)
    const todoUpdate: TodoUpdate = {...updatedTodo}
    return await todosAccess.updateTodo(userId, todoId, todoUpdate)
}

export async function deleteTodo(userId: string, todoId: string) {
    logger.info(`User id: ${userId}, Todo id: ${todoId}`)
    return await todosAccess.deleteTodoItem(userId, todoId)
}

export async function createAttachmentPresignedUrl(userId: string, todoId: string) {
    logger.info(`User id: ${userId}, Todo id: ${todoId}`)
    return await todosAccess.createAttachmentPresignedUrl(userId, todoId)
}