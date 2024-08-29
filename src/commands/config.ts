import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Config } from '../models/Config';

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Set up the bot for your server.')
  .addStringOption(option =>
    option.setName('channel_id')
      .setDescription('The channel id to send notifications to')
      .setRequired(false)
  );

export async function execute(interaction: { reply: (arg0: { embeds?: EmbedBuilder[], content?: string, ephemeral?: boolean }) => any; options: any; guild: { id: string } | null }) {
    try {
        // Check if the command is used in a server
        if (!interaction.guild) {
            return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const serverId = interaction.guild.id;
        const channelId = interaction.options.get('channel_id')?.value as string;

        // Ensure both channel_id and server_id are provided
        if (!channelId) {
            // Check if the server has a config
            const existingConfig = await Config.findOne({ server_id: serverId });

            if (existingConfig) {
                const embed = new EmbedBuilder()
                    .setTitle('Configuration')
                    .setDescription(`The current channel id is <#${existingConfig.channel_id}>`)
                    .setColor('#ff33fc');

                return await interaction.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('Configuration')
                    .setDescription('No configuration found for this server.')
                    .setColor('#ff33fc');

                return await interaction.reply({ embeds: [embed] });
            }
        }

        const existingConfig = await Config.findOne({ server_id: serverId });

        if (existingConfig) {
            existingConfig.channel_id = channelId;
            await existingConfig.save();
        } else {
            const newConfig = new Config({ server_id: serverId, channel_id: channelId });
            await newConfig.save();
        }

        const embed = new EmbedBuilder()
            .setTitle('Configuration Updated')
            .setDescription('The configuration has been updated successfully.')
            .setColor('#ff33fc');

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error updating config:', error);

        const errorEmbed = new EmbedBuilder()
            .setTitle('Error')
            .setDescription('There was an error updating the configuration. Please try again later.')
            .setColor('#ff0000');

        await interaction.reply({ embeds: [errorEmbed] });
    }
}
