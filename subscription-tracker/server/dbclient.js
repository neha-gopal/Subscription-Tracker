const mongoose = require('mongoose');

let isConnected = false;

async function connect() {
    if (isConnected) {
        return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not set. Add it to your .env file.');
    }

    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('Connected to MongoDB');
    return mongoose.connection;
}

module.exports = { connect };
