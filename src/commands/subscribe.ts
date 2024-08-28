import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { Subscription } from '../models/Subscription';
import { ANIME } from '@consumet/extensions';
import stringSimilarity from 'string-similarity';

export const data = new SlashCommandBuilder()
  .setName('subscribe')
  .setDescription('Subscribe to an anime to get notified when a new episode releases.')
  .addStringOption(option =>
    option.setName('anime_name')
      .setDescription('The name of the anime you want to subscribe to')
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  const animeName = interaction.options.get('anime_name')?.value as string;
  const userId = interaction.user.id;
  const Zoro = new ANIME.Zoro();

  await interaction.reply(`Trying to subscribe to ${animeName}...`);

  try {
    const doesExist = await Zoro.search(animeName);

    if (!doesExist || !Array.isArray(doesExist.results) || doesExist.results.length === 0) {
      return interaction.editReply('No results found.');
    }

    // Find the closest match
    const titles = doesExist.results.map(anime => anime.title);
    const bestMatch = stringSimilarity.findBestMatch(animeName, titles.map(title => title.toString()));

    const closestAnime = doesExist.results[bestMatch.bestMatchIndex];
    console.log(`Closest match found: ${closestAnime.title}`);

    // Check if the user is already subscribed to the anime
    const existingSubscription = await Subscription.findOne({ userId });
    console.log(`Existing subscription: ${existingSubscription}`);

    if (existingSubscription) {
      const isAlreadySubscribed = existingSubscription.subscriptions.some(sub => sub.animeName === closestAnime.title.toString());

      if (isAlreadySubscribed) {
        return interaction.editReply(`You are already subscribed to ${closestAnime.title.toString()}!`);
      }

      // Add the new anime to the subscriptions array
      existingSubscription.subscriptions.push({
        animeName: closestAnime.title.toString(),
        lastEpisodeNotified: 0
      });

      await existingSubscription.save();
      console.log(`Added ${closestAnime.title} to existing subscription.`);
    } else {
      // Create a new subscription entry for the user
      const newSubscription = new Subscription({
        userId,
        subscriptions: [{
          animeName: closestAnime.title.toString(),
          lastEpisodeNotified: 0
        }]
      });

      await newSubscription.save();
      console.log(`Created new subscription with ${closestAnime.title}.`);
    }

    await interaction.editReply(`I will notify you when a new episode of ${closestAnime.title.toString()} is going to releases.`);
  } catch (error) {
    console.error('Error subscribing to anime:', error);
    await interaction.editReply('An error occurred while trying to subscribe. Please try again later.');
  }
}
