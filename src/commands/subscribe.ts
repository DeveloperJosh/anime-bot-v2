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
  const animeName = interaction.options.get('anime_name')?.value as string; // Retrieve the value and cast to string
  const userId = interaction.user.id;
  const Zoro = new ANIME.Zoro();

  await interaction.reply(`Subscribing to ${animeName}...`);

  const doesExist = await Zoro.search(animeName);

  if (!doesExist || !Array.isArray(doesExist.results) || doesExist.results.length === 0) {
    return interaction.editReply('No results found.');
  }

  // find the closest match
  const titles = doesExist.results.map(anime => anime.title);
  const bestMatch = stringSimilarity.findBestMatch(animeName, titles.map(title => title.toString()));

  const closestAnime = doesExist.results[bestMatch.bestMatchIndex];

  // check if the user is already subscribed to the anime
  const subscription = await Subscription.findOne({ userId, animeName: closestAnime.title.toString() });

  if (subscription) {
    return interaction.editReply(`You are already subscribed to ${closestAnime.title.toString()}!`);
  }

  // create a new subscription
  const newSubscription = new Subscription({
    userId,
    animeName: closestAnime.title.toString(),
  });

  await newSubscription.save();

  await interaction.editReply(`Subscribed to ${closestAnime.title.toString()}!`);

}