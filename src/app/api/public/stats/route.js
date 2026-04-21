// src/app/api/public/stats/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'seguridad';
    const subcontractorId = searchParams.get('subcontractorId');

    // 1. Obtener lista de subcontratistas para el select del frontend
    const [subcontractors] = await pool.query('SELECT id, name FROM subcontractors WHERE is_active = 1 ORDER BY name ASC');

    // 2. Construir filtros para las estadísticas
    let whereClause = 'WHERE d.type = ? AND d.is_active = 1';
    let params = [type];

    if (subcontractorId && subcontractorId !== 'all') {
      whereClause += ' AND d.subcontractor_id = ?';
      params.push(subcontractorId);
    }

    // 3. Obtener KPIs filtrados (Promedio global de todos los periodos activos)
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM subcontractors WHERE is_active = 1) as total_active_contractors,
        COUNT(*) as total_dossiers,
        AVG(progress_percentage) as avg_compliance
      FROM dossiers d
      ${whereClause}
    `, params);

    // 4. Obtener progreso por contratista (Promediando sus meses si es necesario)
    let contractorProgressQuery = `
      SELECT 
        s.name, 
        AVG(d.progress_percentage) as progress,
        COUNT(d.id) as active_count,
        SUM(CASE WHEN d.physical_status = 'Liberado' THEN 1 ELSE 0 END) as physical_released,
        JSON_ARRAYAGG(JSON_OBJECT('month', d.month, 'year', d.year, 'checklist', d.checklist_json)) as periods_data
      FROM subcontractors s
      JOIN dossiers d ON s.id = d.subcontractor_id
      WHERE d.type = ? AND d.is_active = 1
    `;
    let progressParams = [type];

    if (subcontractorId && subcontractorId !== 'all') {
      contractorProgressQuery += ' AND s.id = ?';
      progressParams.push(subcontractorId);
    }
    
    contractorProgressQuery += ' GROUP BY s.id, s.name ORDER BY progress DESC LIMIT 20';
    const [contractorProgress] = await pool.query(contractorProgressQuery, progressParams);

    // 5. Procesar pendientes mezclados si es una empresa específica
    let pendingPoints = [];
    if (subcontractorId && subcontractorId !== 'all' && contractorProgress.length > 0) {
      const allPeriods = contractorProgress[0].periods_data;
      const monthNames = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      
      allPeriods.forEach(period => {
        const periodLabel = `${monthNames[period.month]} ${period.year}`;
        period.checklist.forEach(point => {
          if (!point.completed) {
            pendingPoints.push({
              ...point,
              title: `${point.title} (${periodLabel})`,
              period: periodLabel
            });
          }
        });
      });
    }

    return NextResponse.json({
      subcontractors,
      kpis: stats[0],
      progress: contractorProgress.map(c => ({
        name: c.name,
        progress: parseFloat(c.progress || 0).toFixed(2),
        active_count: c.active_count,
        physical_released: c.physical_released,
        pendingPoints: pendingPoints.length > 0 ? pendingPoints : []
      })),
      config: {
        type,
        totalPoints: type === 'seguridad' ? 9 : 17
      }
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json(
      { message: 'Error al obtener estadísticas públicas' },
      { status: 500 }
    );
  }
}
