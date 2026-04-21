import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { SEGURIDAD_CHECKLIST, AMBIENTAL_CHECKLIST } from '@/lib/constants';

export async function GET(req) {
  const token = req.cookies.get('token')?.value;
  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const subcontractorId = searchParams.get('subcontractorId') || decoded.subcontractor_id;

    let query = 'SELECT d.*, s.name as subcontractor_name FROM dossiers d JOIN subcontractors s ON d.subcontractor_id = s.id';
    let params = [];

    query += ' WHERE d.is_active = 1';

    if (type) {
      query += ' AND d.type = ?';
      params.push(type);
    }
    
    if (month && year) {
      query += ' AND d.month = ? AND d.year = ?';
      params.push(month, year);
    }

    if (decoded.role !== 'admin' || subcontractorId !== 'all') {
      query += ' AND d.subcontractor_id = ?';
      params.push(subcontractorId);
    }

    query += ' ORDER BY d.year DESC, d.month DESC';

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req) {
  const token = req.cookies.get('token')?.value;
  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { dossierId, checklistData, physicalStatus, action, subcontractorId, type, month, year } = body;

    // Acción de Activación (Solo Admin)
    if (action === 'activate' && decoded.role === 'admin') {
      const defaultChecklist = type === 'seguridad' ? SEGURIDAD_CHECKLIST : AMBIENTAL_CHECKLIST;
      const total = defaultChecklist.length;
      const completed = defaultChecklist.filter(p => p.completed).length;
      const progress = (completed / total) * 100;

      await pool.query(
        'INSERT IGNORE INTO dossiers (subcontractor_id, type, month, year, checklist_json, progress_percentage, physical_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [subcontractorId, type, month, year, JSON.stringify(defaultChecklist), progress, 'No entregado']
      );
      return NextResponse.json({ message: 'Periodo activado correctamente' });
    }

    // Guardado normal de avance
    // 1. Verificar propiedad si es subcontratista
    if (decoded.role === 'subcontractor') {
      const [ownerRows] = await pool.query(
        'SELECT subcontractor_id FROM dossiers WHERE id = ?',
        [dossierId]
      );
      if (!ownerRows.length || ownerRows[0].subcontractor_id !== decoded.subcontractor_id) {
        return NextResponse.json({ message: 'No tienes permiso para editar este dossier' }, { status: 403 });
      }
    }

    // 2. Calcular nuevo porcentaje
    const totalItems = checklistData.length;
    const completedItems = checklistData.filter(item => item.completed).length;
    const progress = (completedItems / totalItems) * 100;

    // 3. Si es admin y hay cambios de nombres, propagar globalmente
    if (decoded.role === 'admin') {
      await pool.query(
        'UPDATE dossiers SET checklist_json = ?, progress_percentage = ?, physical_status = ? WHERE id = ?',
        [JSON.stringify(checklistData), progress, physicalStatus, dossierId]
      );

      const [dInfo] = await pool.query('SELECT type FROM dossiers WHERE id = ?', [dossierId]);
      if (dInfo.length) {
        const dossierType = dInfo[0].type;
        const [allDossiers] = await pool.query('SELECT id, checklist_json FROM dossiers WHERE type = ?', [dossierType]);
        
        for (const d of allDossiers) {
          if (d.id === dossierId) continue;
          let targetChecklist = JSON.parse(JSON.stringify(d.checklist_json));
          let changed = false;
          targetChecklist = targetChecklist.map(targetPoint => {
            const sourcePoint = checklistData.find(sp => sp.id === targetPoint.id);
            if (sourcePoint && sourcePoint.title !== targetPoint.title) {
              changed = true;
              return { ...targetPoint, title: sourcePoint.title };
            }
            return targetPoint;
          });
          if (changed) {
            await pool.query('UPDATE dossiers SET checklist_json = ? WHERE id = ?', [JSON.stringify(targetChecklist), d.id]);
          }
        }
      }
    } else {
      await pool.query(
        'UPDATE dossiers SET checklist_json = ?, progress_percentage = ?, physical_status = ? WHERE id = ?',
        [JSON.stringify(checklistData), progress, physicalStatus, dossierId]
      );
    }

    return NextResponse.json({ message: 'Dossier actualizado correctamente', progress });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Error al actualizar' }, { status: 500 });
  }
}
