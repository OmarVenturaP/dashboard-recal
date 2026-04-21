// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Sesión cerrada' });
  
  response.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });

  return response;
}
