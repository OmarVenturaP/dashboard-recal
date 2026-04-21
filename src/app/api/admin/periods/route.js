// src/app/api/admin/periods/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { SEGURIDAD_CHECKLIST, AMBIENTAL_CHECKLIST } from '@/lib/constants';

export async function GET(req) {
  const token = req.cookies.get('token')?.value;
  const decoded = verifyToken(token);

  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const subcontractorId = searchParams.get('subcontractorId');
    const year = searchParams.get('year');

    if (!subcontractorId || !year) {
      return NextResponse.json({ message: 'Faltan parámetros' }, { status: 400 });
    }

    // Obtener todos los dossiers (Seguridad y Ambiental) de ese subcontratista en ese año
    const [rows] = await pool.query(
      'SELECT type, month, is_active FROM dossiers WHERE subcontractor_id = ? AND year = ?',
      [subcontractorId, year]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req) {
  const token = req.cookies.get('token')?.value;
  const decoded = verifyToken(token);

  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { subcontractorId, month, year, isActive } = await req.json();
    const types = ['seguridad', 'ambiental'];

    for (const type of types) {
      // Intentar actualizar
      const [result] = await pool.query(
        'UPDATE dossiers SET is_active = ? WHERE subcontractor_id = ? AND type = ? AND month = ? AND year = ?',
        [isActive ? 1 : 0, subcontractorId, type, month, year]
      );

      // Si no se actualizó nada, significa que no existe, así que lo creamos
      if (result.affectedRows === 0 && isActive) {
        const defaultChecklist = type === 'seguridad' ? SEGURIDAD_CHECKLIST : AMBIENTAL_CHECKLIST;
        const total = defaultChecklist.length;
        const completed = defaultChecklist.filter(p => p.completed).length;
        const progress = (completed / total) * 100;

        await pool.query(
          'INSERT INTO dossiers (subcontractor_id, type, month, year, checklist_json, progress_percentage, is_active, physical_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [subcontractorId, type, month, year, JSON.stringify(defaultChecklist), progress, 1, 'No entregado']
        );
      }
    }

    return NextResponse.json({ message: 'Periodo actualizado para ambas áreas' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Error al actualizar periodo' }, { status: 500 });
  }
}
