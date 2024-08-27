import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const token = Bun.env.DISCORD_TOKEN;
const mongoUri = Bun.env.MONGO_URI;
const channel = Bun.env.CHANNEL_ID;

if (!token || !mongoUri || !channel) {
  throw new Error('❌ Missing environment variables ❌');
}

try {
  mongoose.connect(mongoUri);
} catch (error) {
  console.error('❌ Error connecting to MongoDB:', error);
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = new Collection<string, any>();

// Load commands
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.ts'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.data.name, command);
}

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.ts'));
for (const file of eventFiles) {
  const event = require(path.join(__dirname, 'events', file)).default;
  event(client, commands, token);
}

// Login the bot
client.login(token);
