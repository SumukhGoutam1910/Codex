import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET individual camera
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const camerasCollection = db.collection('cameras');
    
    const camera = await camerasCollection.findOne({ _id: new ObjectId(params.id) });
    
    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }
    
    return NextResponse.json(camera);
  } catch (error) {
    console.error('Error fetching camera:', error);
    return NextResponse.json({ error: 'Failed to fetch camera' }, { status: 500 });
  }
}

// PATCH (update) individual camera
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, streamUrl, location, status } = await request.json();
    
    const client = await clientPromise;
    const db = client.db();
    const camerasCollection = db.collection('cameras');
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (streamUrl !== undefined) updateData.streamUrl = streamUrl;
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;
    
    // Add updated timestamp
    updateData.updatedAt = new Date().toISOString();
    
    const result = await camerasCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }
    
    console.log(`✅ [Camera Update] Camera ${params.id} updated successfully`);
    return NextResponse.json({
      success: true,
      message: 'Camera updated successfully',
      modified: result.modifiedCount > 0
    });
  } catch (error) {
    console.error('❌ [Camera Update] Error updating camera:', error);
    return NextResponse.json({ error: 'Failed to update camera' }, { status: 500 });
  }
}

// DELETE individual camera
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const camerasCollection = db.collection('cameras');
    
    const result = await camerasCollection.deleteOne({ _id: new ObjectId(params.id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }
    
    console.log(`✅ [Camera Delete] Camera ${params.id} deleted successfully`);
    return NextResponse.json({
      success: true,
      message: 'Camera deleted successfully'
    });
  } catch (error) {
    console.error('❌ [Camera Delete] Error deleting camera:', error);
    return NextResponse.json({ error: 'Failed to delete camera' }, { status: 500 });
  }
}