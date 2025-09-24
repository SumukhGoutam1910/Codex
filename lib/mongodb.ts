import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env');
}


if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri, options);
    (global as any)._mongoClientPromise = client.connect().then((c) => {
      console.log('✅ [MongoDB] Successfully connected (development)');
      return c;
    }).catch((error) => {
      console.error('❌ [MongoDB] Connection failed (development):', error.message);
      throw error;
    });
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect().then((c) => {
    console.log('✅ [MongoDB] Successfully connected (production)');
    return c;
  }).catch((error) => {
    console.error('❌ [MongoDB] Connection failed (production):', error.message);
    throw error;
  });
}

export default clientPromise;
