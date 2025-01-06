import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import { getTemporalClientOptions } from './utils';
import dotenv from 'dotenv';

dotenv.config();

async function runWorker() {
  const temporalClientOptions = getTemporalClientOptions();
  const connection = await NativeConnection.connect(temporalClientOptions);

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'question-time-queue',
  });

  console.log('Worker started and listening to question-time-queue');
  await worker.run();
}

runWorker().catch((err) => {
  console.error('Worker failed to start', err);
  process.exit(1);
});