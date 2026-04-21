// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario en la base de datos
    const [rows] = await pool.query(
      'SELECT u.*, s.name as subcontractor_name FROM users u LEFT JOIN subcontractors s ON u.subcontractor_id = s.id WHERE u.email = ?',
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Comparar contraseña con el hash almacenado
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      subcontractor_id: user.subcontractor_id,
      subcontractor_name: user.subcontractor_name
    });

    // Configurar la respuesta con el token en una cookie
    const response = NextResponse.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        subcontractor_id: user.subcontractor_id,
        subcontractor_name: user.subcontractor_name
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 1 día
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
