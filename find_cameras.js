// Script to find cameras across all databases
const { MongoClient } = require('mongodb');

async function findCameras() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // List all databases
    const dbs = await client.db().admin().listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name));
    
    for (const dbInfo of dbs.databases) {
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      
      console.log(`\n📁 Database: ${dbInfo.name}`);
      console.log(`  Collections: ${collections.map(c => c.name).join(', ')}`);
      
      // Check for cameras in each collection that might contain them
      for (const collection of collections) {
        if (collection.name.toLowerCase().includes('camera') || 
            collection.name === 'cameras' ||
            collection.name === 'devices') {
          
          const docs = await db.collection(collection.name).find({}).toArray();
          if (docs.length > 0) {
            console.log(`  📷 Found ${docs.length} documents in ${collection.name}:`);
            docs.forEach(doc => {
              console.log(`    - ${doc.name || doc._id}: ${doc.streamUrl || 'No stream URL'}`);
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

findCameras();