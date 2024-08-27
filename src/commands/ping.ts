import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!');

export async function execute(interaction: { reply: (arg0: { embeds: EmbedBuilder[] }) => any; }) {
  const embed = new EmbedBuilder()
    .setTitle('Pong!')
    .setColor('#ff33fc')
    .setDescription('Pong!');
  await interaction.reply({ embeds: [embed] });
}
