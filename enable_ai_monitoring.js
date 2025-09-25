// Script to enable AI monitoring for all cameras
const { MongoClient } = require('mongodb');

async function enableAIMonitoring() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('fire_detection_app');
    
    // Enable AI monitoring for all cameras
    const result = await db.collection('cameras').updateMany(
      {}, // Update all cameras
      {
        $set: {
          'metadata.aiMonitoring': true,
          'metadata.aiEnabled': true,
          'metadata.detectionTypes': ['fire', 'smoke'],
          'metadata.confidenceThreshold': 0.7,
          'metadata.alertThreshold': 0.8
        }
      }
    );
    
    console.log(`✅ AI monitoring enabled for ${result.modifiedCount} cameras`);
    
    // Check updated cameras
    const cameras = await db.collection('cameras').find({}).toArray();
    cameras.forEach(camera => {
      console.log(`📷 ${camera.name}: AI monitoring = ${camera.metadata?.aiMonitoring}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

enableAIMonitoring();