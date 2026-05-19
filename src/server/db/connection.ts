import mongoose from 'mongoose';

/**
  Globální deklarace pro uchování připojení v rámci vývojového reloadu.
 */
interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseGlobal: GlobalMongoose | undefined;
}

// Inicializace globálního cache objektu bez warningů o undefined
const mongooseGlobal = globalThis.mongooseGlobal || { conn: null, promise: null };
globalThis.mongooseGlobal = mongooseGlobal;

export async function connectToDatabase(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('Chybí MONGODB_URI v environmentálních proměnných.');
  }

  if (mongooseGlobal.conn) {
    return mongooseGlobal.conn;
  }

  if (!mongooseGlobal.promise) {
    const opts = {
      bufferCommands: false,
      autoIndex: true,
    };

    mongooseGlobal.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('🔌 MongoDB úspěšně připojeno.');
      return m;
    });
  }

  try {
    mongooseGlobal.conn = await mongooseGlobal.promise;
  } catch (e) {
    mongooseGlobal.promise = null;
    throw e;
  }

  return mongooseGlobal.conn;
}
