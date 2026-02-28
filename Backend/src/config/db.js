const mongoose = require('mongoose');
async function connectMongo() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.warn('MONGODB_URI is not set; skipping Mongo connection.');
        return;
    }
    try {
        await mongoose.connect(mongoUri);
        console.log('MongooseDB is connected✅');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
    }
}


module.exports = connectMongo;
