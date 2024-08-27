import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { Subscription } from '../models/Subscription';

export const data = new SlashCommandBuilder()
  .setName('unsubscribe')
  .setDescription('Unsubscribe from an anime to stop getting notified when a new episode releases.')
  .addStringOption(option =>
    option.setName('anime_name')
      .setDescription('The name of the anime you want to unsubscribe from')
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
    const animeName = interaction.options.get('anime_name')?.value as string; 
    const userId = interaction.user.id;

    // Find the user's subscription document
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
        return interaction.reply(`You are not subscribed to ${animeName}!`);
    }

    // Check if the user is subscribed to the specified anime
    const animeIndex = subscription.subscriptions.findIndex(sub => sub.animeName === animeName);

    if (animeIndex === -1) {
        return interaction.reply(`You are not subscribed to ${animeName}!`);
    }

    // Remove the anime from the subscriptions array
    subscription.subscriptions.splice(animeIndex, 1);

    // If the user has no more subscriptions, delete the document
    if (subscription.subscriptions.length === 0) {
        await subscription.deleteOne();
    } else {
        // Otherwise, save the updated document
        await subscription.save();
    }

    await interaction.reply(`Unsubscribed from ${animeName}!`);
}
