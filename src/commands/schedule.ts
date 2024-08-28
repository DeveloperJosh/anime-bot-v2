import { ANIME } from "@consumet/extensions";
import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';

const convertToUnixTimestamp = (timeString: string, dateString: string): number => {
    const [hourString, minute] = timeString.split(':');
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hourString), parseInt(minute));
    return Math.floor(date.getTime() / 1000);
};

export const data = new SlashCommandBuilder()
  .setName('schedule')
  .setDescription('Get the airing schedule for today.');

export async function execute(interaction: CommandInteraction) {
    try {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;

        const Zoro = new ANIME.Zoro();
        const airingSchedule = await Zoro.fetchSchedule(formattedDate);

        if (!airingSchedule || !airingSchedule.results || airingSchedule.results.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('No airing schedule found.')
                .setColor("#ff33fc");

            return await interaction.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Airing Schedule for <t:${convertToUnixTimestamp(date.toTimeString().slice(0, 5), formattedDate)}:F>`)
            .setColor("#ff33fc")
            .setDescription(airingSchedule.results.map(anime => {
                return `**[${anime.title}](${anime.url})** - <t:${convertToUnixTimestamp(anime.airingTime, formattedDate)}:t>`;
            }).join('\n'));

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        const errorEmbed = new EmbedBuilder()
            .setTitle('Error')
            .setDescription('There was an error fetching the airing schedule. Please try again later.')
            .setColor("#ff0000");

        await interaction.reply({ embeds: [errorEmbed] });
    }
}
