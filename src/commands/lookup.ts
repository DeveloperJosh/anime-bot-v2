import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { ANIME } from '@consumet/extensions';
import stringSimilarity from 'string-similarity';

export const data = new SlashCommandBuilder()
  .setName('lookup')
  .setDescription('Look up details of an anime by name')
  .addStringOption(option =>
    option.setName('anime_name')
      .setDescription('The name of the anime you want to look up')
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  const animeName = interaction.options.get('anime_name')?.value as string;
  const Zoro = new ANIME.Zoro(); 

  try {
    // Search for anime
    const searchResults = await Zoro.search(animeName);

    // Check if results exist and are valid
    if (!searchResults || !Array.isArray(searchResults.results) || searchResults.results.length === 0) {
      return interaction.reply({ content: 'No results found.', ephemeral: true });
    }

    // Extract titles and find the closest match
    const titles = searchResults.results.map(anime => anime.title);
    const bestMatch = stringSimilarity.findBestMatch(animeName, titles.map(title => title.toString()));
    const closestAnime = searchResults.results[bestMatch.bestMatchIndex];

    // Fetch detailed anime information
    const animeDetails = await Zoro.fetchAnimeInfo(closestAnime.id);

    // parse the data and remove the episodes array
    const { episodes, ...animeDetailsWithoutEpisodes } = animeDetails;

    // Ensure the description is valid
    const description = animeDetails.description?.trim() || 'No description available.';

    // Create the embed message
    const embed = new EmbedBuilder()
      .setTitle(animeDetails.title?.toString() || 'Unknown Title')
      .setColor("#ff33fc")
      .setThumbnail(animeDetails.image || '')
      .setDescription(description)
      .addFields(
        { name: 'Id', value: animeDetails.id?.toString() || 'N/A', inline: true },
        { name: 'MAL Id', value: animeDetails.malID?.toString() || 'N/A', inline: true },
        { name: "Anlist Id", value: animeDetails.alID?.toString() || 'N/A', inline: true },
        { name: 'Total Episodes', value: animeDetails.totalEpisodes?.toString() || 'N/A', inline: true },
        { name: 'Type', value: animeDetails.type || 'N/A', inline: true },
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Error fetching anime data:', error);
    await interaction.reply({ content: 'Failed to fetch anime details. Please try again later.', ephemeral: true });
  }
}
