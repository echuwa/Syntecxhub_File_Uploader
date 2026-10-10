import { MongoClient, GridFSBucket } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/syntecxhub_file_uploader';
const DB_NAME = process.env.DB_NAME || 'syntecxhub_file_uploader';
const BUCKET_NAME = process.env.GRIDFS_BUCKET || 'uploads';

let client = null;
let db = null;
let bucket = null;

export async function connectDB() {
  if (db && bucket) {
    return { db, bucket };
  }

  try {
    console.log(`🔌 Connecting to MongoDB at ${MONGO_URI.replace(/:([^:@]+)@/, ':****@')}...`);
    client = new MongoClient(MONGO_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(DB_NAME);
    bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });

    console.log(`✅ Connected to MongoDB Database: "${DB_NAME}"`);
    console.log(`📦 GridFS Bucket initialized: "${BUCKET_NAME}" (Collections: ${BUCKET_NAME}.files, ${BUCKET_NAME}.chunks)`);

    return { db, bucket, client };
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Please call connectDB() first.');
  }
  return db;
}

export function getBucket() {
  if (!bucket) {
    throw new Error('GridFS Bucket not initialized. Please call connectDB() first.');
  }
  return bucket;
}

export async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    bucket = null;
    console.log('🔒 MongoDB connection closed');
  }
}
