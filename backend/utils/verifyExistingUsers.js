const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runMigration = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mycampusride';
  console.log(`Connecting to database at: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    // Update all users who either have isVerified set to false or missing (undefined)
    const result = await User.updateMany(
      { $or: [{ isVerified: false }, { isVerified: { $exists: false } }] },
      { $set: { isVerified: true } }
    );

    console.log(`✅ DB Migration Complete! Updated ${result.modifiedCount} existing users to isVerified: true.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed with error:', error.message);
    process.exit(1);
  }
};

runMigration();
