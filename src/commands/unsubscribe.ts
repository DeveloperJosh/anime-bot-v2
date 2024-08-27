import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { Subscription } from '../models/Subscription';

export const data = new SlashCommandBuilder()
  .setName('unsubscribe')
  .setDescription('unsubscribe from an anime to stop getting notified when a new episode releases.')
  .addStringOption(option =>
    option.setName('anime_name')
      .setDescription('The name of the anime you want to unsubscribe from')
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
    const animeName = interaction.options.get('anime_name')?.value as string; 
    const userId = interaction.user.id;

    const subscription = await Subscription.findOne({ userId, animeName });

    if (!subscription) {
        return interaction.reply(`You are not subscribed to ${animeName}!`);
    }

    await subscription.deleteOne();

    await interaction.reply(`Unsubscribed from ${animeName}!`);
}