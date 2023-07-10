import express from 'express';
import { createServer } from 'http';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { randomUUID } from 'crypto';
import logger from 'logger';
import { spawn } from 'child_process';
import path from 'path';

const children = new Map();

const app = express();

app.use((req, res, next) => {
  logger.http(`${req.method} \u00b7 ${req.url}`);
  next();
});

app.get('/', (req, res, next) => {
  const id = randomUUID();
  const child = spawn(path.join(process.cwd(), 'process.sh'));

  children.set(id, { result: null, status: 'in progress' });

  res
    .status(StatusCodes.ACCEPTED)
    .send({ status: `/status/${id}` })
    .end();

  let rawData = '';

  child.stdout.on('data', (chunk) => {
    logger.debug(chunk);
    rawData += chunk;
  });

  child.stderr.on('data', (chunk) => {
    logger.error(chunk);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      children.get(id).status = 'failed';
      return next(new Error('process failed'));
    }

    children.get(id).status = 'done';
    children.get(id).result = Buffer.from(rawData).toString('utf-8');
  });
});

app.get('/status/:id', (req, res, next) => {
  const result = children.get(req.params.id);
  if (!result) {
    return res.status(StatusCodes.NOT_FOUND).send(ReasonPhrases.NOT_FOUND).end();
  }
  res.status(StatusCodes.OK).send(result).end();
});

app.use((error, req, res, next) => {
  logger.error(error.message);
  if (res.headersSent) {
    return next(error);
  }
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
});

createServer(app).listen(3000, () => {
  logger.info('Server started');
});
