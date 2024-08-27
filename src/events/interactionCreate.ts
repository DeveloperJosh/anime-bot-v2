import { Client, CommandInteraction, Collection } from 'discord.js';

const cooldowns = new Collection<string, Collection<string, number>>();

export default (client: Client, commands: Collection<string, any>) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
      console.error(`Command not found: ${interaction.commandName}`);
      return;
    }

    const { cooldown = 3 } = command;
    const now = Date.now();
    const timestamps = cooldowns.get(interaction.commandName) || new Collection<string, number>();
    const cooldownAmount = cooldown * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${interaction.commandName}\` command.`, ephemeral: true });
      }
    }

    timestamps.set(interaction.user.id, now);
    cooldowns.set(interaction.commandName, timestamps);

    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Error executing command:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
      }
    }
  });
};
