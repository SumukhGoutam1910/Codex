import { NextResponse } from 'next/server';
import { mockUsers } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(mockUsers.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    address: user.address
  })));
}