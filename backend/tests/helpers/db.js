import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let replSet;

export async function startTestDb() {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: '4.4.29' },
  });
  await mongoose.connect(replSet.getUri(), { retryWrites: false });
}

export async function stopTestDb() {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
}

export async function clearTestDb() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
