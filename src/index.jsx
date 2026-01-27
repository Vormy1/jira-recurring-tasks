import React, { useState, useEffect } from 'react';
import ForgeReconciler, { Text, Button, Stack, SectionMessage, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [status, setStatus] = useState(null);
  const [existingSchedule, setExistingSchedule] = useState(null);
  const context = useProductContext();

  useEffect(() => {
    if (context && context.extension && context.extension.issue) {
       invoke('getSchedule', { issueId: context.extension.issue.id })
         .then(data => {
            if (data && data.active) {
                setExistingSchedule(data.type);
            }
         });
    }
  }, [context]);

  const runTest = async () => {
    setStatus({ title: 'Запуск...', type: 'info' });
    await invoke('forceRun');
    setStatus({ title: 'Успех!', type: 'success', body: 'Клон задачи создан. Проверьте список задач.' });
  };

  const saveSchedule = async (period) => {
      setStatus({ title: 'Сохранение...', type: 'info' });
      
      await invoke('saveSchedule', { 
          scheduleType: period, 
          issueId: context.extension.issue.id 
      });

      setExistingSchedule(period);
      setStatus({ title: 'Готово!', type: 'success', body: `Расписание установлено: ${period}` });
  };

  if (!context) return <Text>Загрузка...</Text>;

  return (
    <Stack space="space.200">
      
      {existingSchedule && (
          <SectionMessage title="Активное расписание" appearance="info">
              <Text>Эта задача повторяется: {existingSchedule === 'DAILY' ? 'Ежедневно' : 'Еженедельно'}</Text>
          </SectionMessage>
      )}

      {/* Сообщения о действиях */}
      {status && (
        <SectionMessage title={status.title} appearance={status.type}>
            <Text>{status.body || ''}</Text>
        </SectionMessage>
      )}

      <Text>Настроить повтор:</Text>
      
      <Button onClick={() => saveSchedule('DAILY')}>
        📅 Каждый день
      </Button>
      
      <Button onClick={() => saveSchedule('WEEKLY')}>
        📅 Раз в неделю
      </Button>

      <Text>----------------</Text>

      <Button appearance="primary" onClick={runTest}>
        ⚡ Тест: Создать копию сейчас
      </Button>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);