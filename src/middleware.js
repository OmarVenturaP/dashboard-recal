// src/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  // Rutas públicas que no requieren autenticación
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/api/public')) {
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard/admin', req.url)); // Redirección básica
    }
    return NextResponse.next();
  }

  // Verificar token para rutas protegidas
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const { payload } = await jwtVerify(token, secret);
    
    // Aquí podrías añadir lógica de RBAC (Control de Acceso basado en Roles)
    if (pathname.startsWith('/dashboard/admin') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/subcontractor', req.url));
    }
    
    if (pathname.startsWith('/dashboard/subcontractor') && payload.role !== 'subcontractor') {
      return NextResponse.redirect(new URL('/dashboard/admin', req.url));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
