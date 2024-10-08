import { ANIME } from '@consumet/extensions';
import { Subscription } from '../models/Subscription';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { Config } from '../models/Config';

const Zoro = new ANIME.Zoro();

const convertToUnixTimestamp = (timeString: string, dateString: string): number => {
  const [hourString, minute] = timeString.split(':');
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hourString), parseInt(minute));
  return Math.floor(date.getTime() / 1000); 
};

export const checkAiring = async (client: Client) => {
  try {
    // Get channel IDs from all servers in the DB
    const configs = await Config.find({}).select('channel_id');

    if (!configs || configs.length === 0) {
      console.log('No server configurations found.');
      return;
    }

    const subscriptions = await Subscription.find({});
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;

    console.log('Checking airing schedule for', formattedDate);
    const airingSchedule = await Zoro.fetchSchedule(formattedDate);

    if (!airingSchedule || !airingSchedule.results) {
      console.error('No airing schedule results found.');
      return;
    }

    if (subscriptions.length > 0) {
      const userNotifications: { [key: string]: string[] } = {};

      for (const subscription of subscriptions) {
        for (const sub of subscription.subscriptions) {
          const anime = airingSchedule.results.find(anime => typeof anime.title === 'string' && anime.title.toLowerCase() === sub.animeName?.toLowerCase());

          if (anime) {
            const unixTimestamp = convertToUnixTimestamp(anime.airingTime, formattedDate);
            const formattedTime = `<t:${unixTimestamp}:t>`; 
            const message = `The anime [${sub.animeName}](${anime.url}) is on the schedule and airs at ${formattedTime}! 🎉`;

            if (!userNotifications[subscription.userId]) {
              userNotifications[subscription.userId] = [];
            }
            userNotifications[subscription.userId].push(message);

            const episodeNumber = parseInt(anime.airingEpisode?.match(/\d+/)?.[0] || "0", 10);

            await Subscription.updateOne(
              { userId: subscription.userId, 'subscriptions.animeName': sub.animeName },
              { $set: { 'subscriptions.$.lastEpisodeNotified': episodeNumber } }
            );
          } else {
            console.log(`No match found for anime: ${sub.animeName} for user: ${subscription.userId}`);
          }
        }
      }

      // Send notifications to users
      for (const userId in userNotifications) {
        try {
          const user = await client.users.fetch(userId);
          const user_channel = await user.createDM();
          const combinedMessage = userNotifications[userId].join('\n\n');
          await user_channel.send(combinedMessage);
        } catch (err) {
          console.error(`Failed to notify user ${userId}:`, err);
        }
      }

      // Send the schedule summary to each channel
      for (const config of configs) {
        const channel = (await client.channels.fetch(config.channel_id)) as TextChannel;

        if (!channel) {
          console.error(`Channel with ID ${config.channel_id} not found.`);
          continue;
        }

        const embed = new EmbedBuilder()
          .setTitle('Airing Schedule Summary')
          .setColor('#ff33fc')
          .setDescription('Here are the anime airing today:')
          .addFields(
            airingSchedule.results.map(anime => ({
              name: typeof anime.title === 'string' ? anime.title : String(anime.title),
              value: `${anime.airingEpisode?.toString() || 'N/A'} at <t:${convertToUnixTimestamp(anime.airingTime, formattedDate)}:t>`,
              inline: false
            }))
          );

        await channel.send({ embeds: [embed] });
      }

    } else {
      console.log('No subscriptions found.');
    }
  } catch (err) {
    console.error('Error during airing schedule check:', err);
  }
};
