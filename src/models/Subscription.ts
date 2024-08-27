import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  subscriptions: [
    {
      animeName: { type: String, required: true },
      lastEpisodeNotified: { type: Number, default: 0 }
    }
  ]
});

export const Subscription = mongoose.model('Subscription', SubscriptionSchema);
