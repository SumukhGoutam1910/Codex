// Script to initialize admin and responder accounts in MongoDB
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://tomchandler0804:tomc08042005@cluster0.pjz7nl8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function initializeAccounts() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('fire_detection_app');
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const responderPassword = await bcrypt.hash('responder123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    
    // Create admin accounts
    const adminAccounts = [
      {
        name: 'Admin User',
        email: 'admin@firedetection.com',
        passwordHash: adminPassword,
        role: 'admin',
        address: 'Fire Department HQ',
        createdAt: new Date(),
        permissions: ['view_all', 'manage_users', 'manage_cameras', 'manage_incidents']
      },
      {
        name: 'John Admin',
        email: 'john.admin@firedetection.com',
        passwordHash: adminPassword,
        role: 'admin',
        address: 'Emergency Services Center',
        createdAt: new Date(),
        permissions: ['view_all', 'manage_users', 'manage_cameras', 'manage_incidents']
      }
    ];
    
    // Create responder accounts
    const responderAccounts = [
      {
        name: 'Fire Responder 1',
        email: 'responder1@firedetection.com',
        passwordHash: responderPassword,
        role: 'responder',
        address: 'Fire Station 1',
        createdAt: new Date(),
        badge: 'FR001',
        department: 'Fire Department',
        permissions: ['view_incidents', 'respond_incidents', 'view_cameras']
      },
      {
        name: 'Emergency Responder',
        email: 'emergency@firedetection.com',
        passwordHash: responderPassword,
        role: 'responder',
        address: 'Emergency Response Unit',
        createdAt: new Date(),
        badge: 'ER001',
        department: 'Emergency Services',
        permissions: ['view_incidents', 'respond_incidents', 'view_cameras']
      }
    ];
    
    // Create regular user accounts
    const userAccounts = [
      {
        name: 'Regular User',
        email: 'user@firedetection.com',
        passwordHash: userPassword,
        role: 'user',
        address: 'Building A, Floor 1',
        createdAt: new Date(),
        permissions: ['view_own_cameras', 'view_own_incidents']
      }
    ];
    
    // Insert accounts into respective collections
    await db.collection('admins').deleteMany({}); // Clear existing
    await db.collection('responders').deleteMany({}); // Clear existing
    await db.collection('users').deleteMany({}); // Clear existing
    
    const adminResult = await db.collection('admins').insertMany(adminAccounts);
    const responderResult = await db.collection('responders').insertMany(responderAccounts);
    const userResult = await db.collection('users').insertMany(userAccounts);
    
    console.log(`✅ Created ${adminResult.insertedCount} admin accounts`);
    console.log(`✅ Created ${responderResult.insertedCount} responder accounts`);
    console.log(`✅ Created ${userResult.insertedCount} user accounts`);
    
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@firedetection.com / admin123');
    console.log('Responder: responder1@firedetection.com / responder123');
    console.log('User: user@firedetection.com / user123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

initializeAccounts();