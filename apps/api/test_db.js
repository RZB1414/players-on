import { MongoClient } from 'mongodb';
import { getActiveSessions } from './src/services/sessionService.js';

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Need MONGODB_URI");

    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to DB");

    // We get the first user ID and test it
    const db = client.db('playerson');
    const user = await db.collection('users').findOne({});
    if (!user) {
        console.log("No users found");
        process.exit(0);
    }
    const userId = user._id.toString();
    console.log("Testing with User ID:", userId);

    try {
        const sessions = await getActiveSessions(userId, db);
        console.log("Success! Found sessions:", sessions.length);
    } catch (e) {
        console.error("FAILED with error:");
        console.error(e);
    } finally {
        await client.close();
    }
}

run();
