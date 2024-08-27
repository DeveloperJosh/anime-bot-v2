import { ActivityType, Client } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { setupAiringCheck } from '../corn';

export default (client: Client, commands: any, token: string) => {
  client.once('ready', async () => {
    console.log(`🎉 Logged in as ${client.user?.tag}! 🎉`);
    setupAiringCheck(client);
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    // show the time in the console, like 1pm or 1am
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

  
    console.log('Checking airing schedule for', formattedDate, 'at', time);

    if (client.user) {
      client.user.setActivity('The Zoro Schedule', { type: ActivityType.Watching });
    } else {
      console.error('❌ Client user is not defined ❌');
    }

    const rest = new REST({ version: '10' }).setToken(token);
    const commandData = commands.map((command: any) => command.data.toJSON());

    try {
      const userId = client.user?.id;
      if (!userId) {
        console.error('❌ Client user ID is not defined ❌');
        return;
      }

      await rest.put(Routes.applicationCommands(userId), { body: commandData });
      console.log('✅ Successfully registered application commands! ✅');
    } catch (error) {
      console.error('⚠️ Error registering commands:', error);
    }
  });
};
