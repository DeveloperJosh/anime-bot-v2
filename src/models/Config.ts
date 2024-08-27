// TODO: Add to to a command
import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
    server_id: { type: String, required: true },
    channel_id: { type: String, required: true },
});

export const Config = mongoose.model('Config', ConfigSchema);