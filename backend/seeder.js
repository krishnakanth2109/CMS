import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedData = async () => {
    try {
        // 1. Connect to Database
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME || 'cms_resume'
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // 2. Clear existing users to avoid duplicates
        // Warning: This clears all users! verify if this is desired behavior for production. 
        // For a seeder script, it is usually fine, but be careful.
        // await User.deleteMany(); 
        // console.log('Existing users removed');

        // 3. Create Admin from Environment Variables (Optional)
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
            if (!adminUser) {
                await User.create({
                    username: process.env.ADMIN_USERNAME || 'admin',
                    password: process.env.ADMIN_PASSWORD,
                    name: process.env.ADMIN_NAME || 'Admin User',
                    role: 'admin',
                    email: process.env.ADMIN_EMAIL,
                    active: true
                });
                console.log('Admin user created from environment variables.');
            } else {
                console.log('Admin user already exists.');
            }
        } else {
            console.log('No ADMIN_EMAIL and ADMIN_PASSWORD found in environment variables. No users created.');
        }

        console.log('Seeding process completed.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();