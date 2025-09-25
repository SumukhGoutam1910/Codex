import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // First, try to find user in users collection (regular users)
    let user = await db.collection('users').findOne({ email });
    let userType = 'user';

    // If not found in users, check admins collection
    if (!user) {
      user = await db.collection('admins').findOne({ email });
      userType = 'admin';
    }

    // If not found in admins, check responders collection
    if (!user) {
      user = await db.collection('responders').findOne({ email });
      userType = 'responder';
    }

    // If user not found in any collection
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash || user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || userType,
          address: user.address,
          userType: userType
        }
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || userType,
        address: user.address,
        userType: userType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}