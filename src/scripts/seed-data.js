// src/scripts/seed-data.js
const mysql = require('mysql2/promise');

const SEGURIDAD_NAMES = [
  "PROCEDIMIENTO TECNICO CONSTRUCTIVO",
  "MATRIZ Y EVALUACIÓN DE RIESGO",
  "ANALISIS DE SEGURIDAD EN EL TRABAJO",
  "COPIA DE PAGO DE SISTEMA UNICO DE RETENCIÓN SUA",
  "COPIAS DE MOVIMIENTOS AFILIATORIOS ALTAS",
  "EXAMEN MEDICO DE ADMISION",
  "PLATICA DE INDUCCIÓN EN SEGURIDAD Y SALUD",
  "DIRECTORIO DE LA EMPRESA",
  "FUERZA DE TRABAJO",
  "POLIZAS DE SEGURO",
  "PROGRAMA DE UTILIZACIÓN DE MAQUINARIA Y EQUIPO",
  "PROGRAMA DE MANTENIMIENTO DE MAQUINARIA Y EQUIPO MENOR",
  "CONSTANCIA DE HABILIDADES DC3",
  "HOJAS DE DATOS DE SEGURIDAD",
  "DOTACIÓN DE EQUIPO DE PROTECCIÓN PERSONAL",
  "BRIGADAS DE ATENCION Y RESPUESTA A EMERGENCIA",
  "COMISIÓN DE SEGURIDAD E HIGIENE",
  "ASIGNACIÓN SUPERVISOR DE SEGURIDAD E HIGIENE",
  "PROGRAMAS",
  "INFORME DE SEGURIDAD Y SALUD",
  "PROGRAMA DE EPP",
  "PROGRAMA DE SEGURIDAD E HIGIENE",
  "PDT, AST Y LISTA RIJ"
];

const SEGURIDAD_DEFAULTS = [1, 2, 3, 8, 14, 17, 19, 21, 22];

const SEGURIDAD_CHECKLIST = [
  ...SEGURIDAD_NAMES.map((title, i) => ({
    id: i + 1,
    title,
    completed: SEGURIDAD_DEFAULTS.includes(i + 1)
  })),
  { id: 24, title: "Documentación Escaneada", completed: false }
];

const AMBIENTAL_CHECKLIST = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1,
  title: `Requisito Ambiental ${i + 1}`,
  completed: false,
})).concat([{ id: 46, title: "Expediente Ambiental Escaneado", completed: false }]);

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA, rejectUnauthorized: false } : undefined
  });

  try {
    console.log('Sembrando datos por periodos mensuales...');
    
    // Obtenemos todos los dossiers iniciales creados por el schema
    const [dossiers] = await connection.query('SELECT id, type, subcontractor_id, month, year FROM dossiers');
    
    for (const dossier of dossiers) {
        const checklist = dossier.type === 'seguridad' ? SEGURIDAD_CHECKLIST : AMBIENTAL_CHECKLIST;
        const total = checklist.length;
        const completed = checklist.filter(p => p.completed).length;
        const progress = (completed / total) * 100;
        
        await connection.query(
            'UPDATE dossiers SET checklist_json = ?, progress_percentage = ? WHERE id = ?',
            [JSON.stringify(checklist), progress, dossier.id]
        );
    }

    // Insertar un mes adicional para RECAL (ID 1) para probar la mezcla de pendientes
    const jan2024Checklist = JSON.parse(JSON.stringify(SEGURIDAD_CHECKLIST));
    // En este mes, el punto 4 también está completado
    jan2024Checklist.find(p => p.id === 4).completed = true;
    const totalJan = jan2024Checklist.length;
    const completedJan = jan2024Checklist.filter(p => p.completed).length;
    const progressJan = (completedJan / totalJan) * 100;

    await connection.query(
      'INSERT IGNORE INTO dossiers (subcontractor_id, type, month, year, checklist_json, progress_percentage) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 'seguridad', 1, 2024, JSON.stringify(jan2024Checklist), progressJan]
    );
    
    console.log('✅ Base de datos poblada con múltiples periodos!');
  } catch (error) {
    console.error('Error seeding:', error);
  } finally {
    await connection.end();
  }
}

seed();
