import { CancellationToken } from '@withmono/jobs';

const jobCancellationToken = new CancellationToken();

/**
 * Set up cron jobs and triggered job workers
 */
export function startJobs(): void {}

/**
 * Signal all jobs to stop. Prevents new jobs from starting.
 */
export async function stopJobs(): Promise<void> {
  await jobCancellationToken.cancel();
}
