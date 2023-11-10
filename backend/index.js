const { MongoClient } = require('mongodb');
require('dotenv').config()

// Replace the uri string with your connection string.
const uri = process.env.CONNECTION_STRING;
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    const database = client.db("papers");
    const collection = database.collection("ungraded");

    // Example: Insert a document
    const doc = { name: "Apple", color: "Green" };
    const result = await collection.insertOne(doc);

    console.log(`New document created with the following id: ${result.insertedId}`);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

run().catch(console.dir);
