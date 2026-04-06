import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️ MONGODB_URI is not defined. Database features will be simulated.");
  } else {
    throw new Error("❌ MONGODB_URI is not defined. Please add it to your environment variables.");
  }
}

/**
 * Global cache to prevent multiple connections on Vercel/Serverless hot reloads.
 */
interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseGlobal | undefined;
}

let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Optimal for serverless to prevent exhaustion
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("✅ TrustCert Registry effectively settled on MongoDB.");
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e: any) {
    cached!.promise = null;
    
    // Provide a more descriptive error for Atlas IP whitelisting
    if (e.name === 'MongooseServerSelectionError' || e.message.includes('whitelist')) {
      console.error("\n❌ TRUSTCERT_DATABASE_FATAL: MongoDB Atlas IP Access Denied.");
      console.error("👉 Please ensure your IP address is effectively whitelisted on the Atlas cluster.");
      console.error("👉 Visit: https://www.mongodb.com/docs/atlas/security-whitelist/\n");
      
      throw new Error(`[TRUSTCERT_DATABASE_DENIED] Your IP is not effectively whitelisted on the established registry. Settlement failed.`);
    }
    
    throw e;
  }

  return cached!.conn;
}

export default dbConnect;
export { dbConnect };
