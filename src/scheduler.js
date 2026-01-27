import { storage, route, asApp } from '@forge/api';

export async function run(event) {
  console.log("⏰ Scheduler: Проверка расписания...");

  const result = await storage.query()
    .where('key', startsWith('job_'))
    .limit(10)
    .getMany();

  const jobs = result.results;
  const now = new Date();

  for (const job of jobs) {
    const settings = job.value;
    const nextRun = new Date(settings.nextRun);

    if (settings.active) {
        console.log(`🚀 ЗАПУСК: Клонируем задачу ${settings.issueId}`);
        
        try {
            const issueResponse = await asApp().requestJira(route`/rest/api/3/issue/${settings.issueId}`);
            
            if (!issueResponse.ok) {
                console.error(`Ошибка чтения: ${issueResponse.status}`);
                continue;
            }
            
            const originalIssue = await issueResponse.json();

            const newIssueBody = {
                fields: {
                    project: { id: originalIssue.fields.project.id },
                    summary: `[Auto] ${originalIssue.fields.summary}`,
                    description: originalIssue.fields.description,
                    issuetype: { id: originalIssue.fields.issuetype.id },
                }
            };


            const createResponse = await asApp().requestJira(route`/rest/api/3/issue`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(newIssueBody)
            });

            if (createResponse.ok) {
                const createdIssue = await createResponse.json();
                console.log(`✅ УСПЕХ: Создана задача ${createdIssue.key}`);
            } else {
                console.error(`❌ Ошибка создания: ${createResponse.status}`);
                const err = await createResponse.text();
                console.error(err);
            }


            const newNextRun = new Date();
            newNextRun.setMinutes(newNextRun.getMinutes() + 5); 

            await storage.set(job.key, {
                ...settings,
                nextRun: newNextRun.toISOString()
            });

        } catch (error) {
            console.error("Critical error:", error);
        }
    }
  }
}

function startsWith(prefix) {
    return { condition: 'STARTS_WITH', value: prefix };
}