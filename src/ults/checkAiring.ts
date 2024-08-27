import { ANIME } from '@consumet/extensions';
import { Subscription } from '../models/Subscription';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';

const Zoro = new ANIME.Zoro();
const channel_id = Bun.env.CHANNEL_ID;

// Utility function to convert military time to 12-hour format
const convertTo12HourFormat = (time: string) => {
  const [hourString, minute] = time.split(':');
  let hour = parseInt(hourString);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12; // Convert hour to 12-hour format and handle midnight (0:00)
  return `${hour}:${minute} ${ampm}`;
};

export const checkAiring = async (client: Client) => {
  try {
    const subscriptions = await Subscription.find({});
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;

    console.log('Checking airing schedule for', formattedDate);
    const airingSchedule = await Zoro.fetchSchedule(formattedDate); // Fetching the airing schedule

    console.log('Checking airing schedule...');

    if (subscriptions.length > 0) {
      const userNotifications: { [userId: string]: string[] } = {};

      // Prepare notifications for each user
      for (const subscription of subscriptions) {
        const anime = airingSchedule.results.find(anime => anime.title === subscription.animeName);
        if (anime) {
          const formattedTime = convertTo12HourFormat(anime.airingTime);
          const message = `New episode of [${subscription.animeName}](${anime.url}) is airing at ${formattedTime}! 🎉`;

          if (!userNotifications[subscription.userId]) {
            userNotifications[subscription.userId] = [];
          }
          userNotifications[subscription.userId].push(message);

          await Subscription.updateOne(
            { userId: subscription.userId, animeName: subscription.animeName },
            { lastNotified: new Date() }
          );
        }
      }

      // Send a consolidated message to each user
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

      // Prepare a summary embed for the channel
      const channel = (await client.channels.fetch(channel_id)) as TextChannel;
      const embed = new EmbedBuilder()
        .setTitle('Airing Schedule Summary')
        .setColor('#ff33fc')
        .setDescription('Here are the anime airing today:')
        .addFields(
          airingSchedule.results.map(anime => ({
            name: anime.title?.toString() || 'Unknown Title',
            value: `Episode ${anime.airingEpisode?.toString() || 'N/A'} at ${convertTo12HourFormat(anime.airingTime)}`,
            inline: false
          }))
        );

      // Send the summary embed
      await channel.send({ embeds: [embed] });

    } else {
      console.log('No subscriptions found.');
    }
  } catch (err) {
    console.error('Error during airing schedule check:', err);
  }
};
