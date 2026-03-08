const mongoose = require('mongoose');
const config = require('./index');

let connectionPromise = null;

async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose.connect(config.mongo.uri, {
    maxPoolSize: 3,
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await connectionPromise;
    return mongoose.connection;
  } finally {
    connectionPromise = null;
  }
}

async function disconnectMongo() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}

module.exports = {
  connectMongo,
  disconnectMongo,
};
