// Script to check camera database structure
const { MongoClient } = require('mongodb');

async function checkCameras() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('fire_detection_app');
    const cameras = await db.collection('cameras').find({}).toArray();
    
    console.log(`Found ${cameras.length} cameras:`);
    cameras.forEach((camera, index) => {
      console.log(`\n📷 Camera ${index + 1}:`);
      console.log(`  Name: ${camera.name}`);
      console.log(`  Stream URL: ${camera.streamUrl}`);
      console.log(`  Status: ${camera.status}`);
      console.log(`  Metadata: ${JSON.stringify(camera.metadata, null, 2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkCameras();