import mongoose from 'mongoose';
import { config } from '../config/env';
import { CommunityChannel } from '../models/CommunityChannel.model';

const fallbackImages = [
  'https://picsum.photos/seed/community-study/240/160',
  'https://picsum.photos/seed/community-tech/240/160',
  'https://picsum.photos/seed/community-ai/240/160',
  'https://picsum.photos/seed/community-career/240/160',
  'https://picsum.photos/seed/community-exam/240/160',
  'https://picsum.photos/seed/community-coding/240/160',
];

const run = async () => {
  await mongoose.connect(config.mongoUri);
  const channels = await CommunityChannel.find({ isArchived: false }).sort({ name: 1 });

  await Promise.all(
    channels.map((channel, index) => {
      if (channel.imageUrl) return Promise.resolve();
      channel.imageUrl = fallbackImages[index % fallbackImages.length];
      return channel.save();
    })
  );

  await mongoose.disconnect();
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
