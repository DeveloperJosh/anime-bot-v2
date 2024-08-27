import cron from 'cron';
import { Client } from 'discord.js';
import { checkAiring } from './ults/checkAiring';

export const setupAiringCheck = (client: Client) => {
  const job = new cron.CronJob('0 1 * * *', async () => {
    try {
      await checkAiring(client); 
      console.log('✅ Airing schedule checked at 1 AM');
    } catch (error) {
      console.error('❌ Error checking airing schedule:', error);
    }
  });

  console.log('🌽 Airing check job created to run at 1 AM daily 🌽');
  job.start();
};
