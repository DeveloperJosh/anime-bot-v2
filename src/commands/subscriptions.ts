import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { Subscription } from '../models/Subscription';

export const data = new SlashCommandBuilder()
  .setName('subscriptions')
  .setDescription('Show all the anime you have subscribed to.');

export async function execute(interaction: CommandInteraction) {
    try {
        const userId = interaction.user.id;

        // Fetch the user's subscription data
        const userSubscription = await Subscription.findOne({ userId });

        if (!userSubscription || userSubscription.subscriptions.length === 0) {
            const noSubscriptionsEmbed = new EmbedBuilder()
                .setTitle('No Subscriptions Found')
                .setDescription('You have not subscribed to any anime.')
                .setColor('#ff33fc');

            return await interaction.reply({ embeds: [noSubscriptionsEmbed] });
        }

        // Prepare a list of the user's subscriptions in plain text
        const subscriptionsList = userSubscription.subscriptions.map((sub) => {
            return `${sub.animeName}`;
        }).join('\n');

        // Create an embed to display the subscriptions
        const subscriptionsEmbed = new EmbedBuilder()
            .setTitle('Your Anime Subscriptions')
            .setDescription(subscriptionsList)
            .setColor('#ff33fc');

        await interaction.reply({ embeds: [subscriptionsEmbed] });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);

        const errorEmbed = new EmbedBuilder()
            .setTitle('Error')
            .setDescription('There was an error retrieving your subscriptions. Please try again later.')
            .setColor('#ff0000');

        await interaction.reply({ embeds: [errorEmbed] });
    }
}
