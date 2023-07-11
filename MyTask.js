import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

export default class Task {
  constructor() {
    this.id = randomUUID();
    this.self = `/tasks/${this.id}`;
    this.status = 'pending';
    this.result = null;
    this.resourceLocation = `/tasks/${this.id}/result`;
  }
  async run() {
    const result = await cpuIntensiveTask();
    this.status = 'fulfilled';
    this.result = result;
    return result;
  }
  getStatus() {
    return this;
  }
}

function cpuIntensiveTask() {
  return new Promise((resolve, reject) => {
    spawn('./process.sh').on('close', (code) => {
      if (code) {
        reject(`spawn exit code ${code}`);
      } else {
        resolve('yes');
      }
    });
  });
}
