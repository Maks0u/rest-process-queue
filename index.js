import express from 'express';
import { createServer } from 'http';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import logger from 'logger';

import Task from './MyTask.js';

const tasks = new Map();

const app = express();

app.use((req, res, next) => {
  logger.http(`${req.method} \u00b7 ${req.url}`);
  next();
});

app.post('/tasks', (req, res, next) => {
  const task = new Task();
  tasks.set(task.id, task);
  task.run();
  return res.status(StatusCodes.ACCEPTED).send(task).end();
});

app.get('/tasks/:id', (req, res, next) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(StatusCodes.NOT_FOUND).send('Task not found').end();
  }
  res.setHeader('Content-Type', 'application/json');
  return res.status(StatusCodes.OK).send(task).end();
});

app.get('/tasks/:id/result', (req, res, next) => {
  const task = tasks.get(req.params.id);
  res.setHeader('Content-Type', 'text/plain');
  if (!task) {
    return res.status(StatusCodes.NOT_FOUND).send('Task not found').end();
  }
  if (task.status === 'pending') {
    return res.status(StatusCodes.NOT_FOUND).send('Task pending').end();
  }
  return res.status(StatusCodes.OK).send(task.result).end();
});

app.get('/health', (req, res, next) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(StatusCodes.OK).send(ReasonPhrases.OK).end();
});

/**
 * Error handling
 */
app.use((error, req, res, next) => {
  logger.error(error.message);
  if (res.headersSent) {
    return next(error);
  }
  res.setHeader('Content-Type', 'text/plain');
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
});

createServer(app).listen(3000, () => {
  logger.info('Server started');
});
