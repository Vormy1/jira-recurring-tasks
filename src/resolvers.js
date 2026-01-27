import Resolver from '@forge/resolver';
import { storage } from '@forge/api';
import { run } from './scheduler';

const resolver = new Resolver();

resolver.define('saveSchedule', async (req) => {
  console.log("🔥 BACKEND: saveSchedule вызван!");
  const { issueId, scheduleType } = req.payload;
  
  const now = new Date();
  let nextRun = new Date();
  
  if (scheduleType === 'MONTHLY') {
    nextRun.setMinutes(now.getMinutes() + 5); 
  } else {
    nextRun.setDate(now.getDate() + 1);
  }

  await storage.set(`job_${issueId}`, {
    issueId,
    type: scheduleType,
    nextRun: nextRun.toISOString(),
    active: true
  });

  return { status: 'success' };
});

resolver.define('getSchedule', async (req) => {
  const { issueId } = req.payload;
  return await storage.get(`job_${issueId}`) || null;
});

resolver.define('forceRun', async () => {
    console.log("🔥 BACKEND: Ручной запуск!");
    await run();
    return { status: 'triggered' };
});

export const handler = resolver.getDefinitions();