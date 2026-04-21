"use client";
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2,
  Users,
  LayoutDashboard,
  ArrowRight,
  Shield,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dossierType, setDossierType] = useState('seguridad');
  const [subcontractorId, setSubcontractorId] = useState('all');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/stats?type=${dossierType}&subcontractorId=${subcontractorId}`);
        const stats = await res.json();
        setData(stats);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [dossierType, subcontractorId]);

  const COLORS = ['#3b82f6', '#60a5fa', '#2563eb', '#1e40af'];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="h-20 border-b border-slate-800/50 backdrop-blur-xl sticky top-0 z-50 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/40">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">HSE RECAL</span>
        </div>
        <Link 
          href="/login" 
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all border border-slate-700 active:scale-95"
        >
          Acceso Administrativo
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Hero Section & Filters */}
        <div className="flex flex-col lg:flex-row items-end justify-between gap-8 pb-8 border-b border-slate-800/50">
          <div className="space-y-4 max-w-2xl text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Estatus de <span className="text-blue-500">Contratistas</span>
            </h1>
            <p className="text-lg text-slate-400">
              Visualización del progreso en la entrega de fisica/digital del Dossier {dossierType === 'seguridad' ? 'Seguridad' : 'Ambiental'}.
            </p>
          </div>

          {/* Controls Container */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto bg-[#0f172a] p-2 rounded-2xl border border-slate-800 shadow-2xl">
            {/* Dossier Type Toggle */}
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                onClick={() => setDossierType('seguridad')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  dossierType === 'seguridad' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Seguridad
              </button>
              <button
                onClick={() => setDossierType('ambiental')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  dossierType === 'ambiental' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Ambiental
              </button>
            </div>

            {/* Subcontractor Selector */}
            <select
              value={subcontractorId}
              onChange={(e) => setSubcontractorId(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-64 p-2.5 outline-none hover:border-slate-700 transition-colors"
            >
              <option value="all">Todas las Empresas</option>
              {data?.subcontractors?.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Global KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KPICard 
                title={subcontractorId === 'all' ? "Empresas Activas" : "Estatus de Empresa"}
                value={subcontractorId === 'all' ? (data?.kpis?.total_active_contractors || '0') : "Específico"} 
                icon={Users} 
                subtitle={subcontractorId === 'all' ? "Contratistas en red" : data?.progress?.[0]?.name}
              />
              <KPICard 
                title="Dossiers Registrados" 
                value={data?.kpis?.total_dossiers || '0'} 
                icon={Shield} 
                subtitle={`Tipo: ${dossierType === 'seguridad' ? 'Seguridad' : 'Ambiental'}`}
              />
              <KPICard 
                title="Avance de Entrega" 
                value={`${Math.round(data?.kpis?.avg_compliance || 0)}%`} 
                icon={TrendingUp} 
                subtitle={`Meta: ${data?.config?.totalPoints} puntos entregados`}
              />
            </div>

            {subcontractorId === 'all' ? (
              /* Charts Grid - Vista General */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in duration-500">
                {/* Progress Chart */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity className="w-24 h-24 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                    Cumplimiento por Contratista
                  </h3>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.progress || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#3b82f6' }}
                        />
                        <Bar dataKey="progress" radius={[6, 6, 0, 0]} barSize={40}>
                          {(data?.progress || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.progress > 80 ? '#3b82f6' : '#60a5fa'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Distribution Chart */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                    Distribución de Estatus
                  </h3>
                  <div className="h-[350px] flex flex-col md:flex-row items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.distribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="status"
                        >
                          {(data?.distribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-4 mt-6 md:mt-0 md:ml-8 w-full md:w-auto">
                      {(data?.distribution || []).map((entry, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-sm font-medium text-slate-400 capitalize">{entry.status}</span>
                          <span className="text-sm font-bold text-white ml-auto">{entry.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Vista de Puntos Pendientes - Vista Individual Acumulada */
              <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-slate-800 gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Shield className="text-amber-500 w-8 h-8" />
                      Pendientes de Entrega (Acumulativo)
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Lista consolidada de todos los periodos activos asignados.</p>
                  </div>
                  <div className="px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 font-bold text-lg">
                    {data?.progress?.[0]?.pendingPoints?.length || 0} Requerimientos
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(data?.progress?.[0]?.pendingPoints || []).map((point, index) => (
                    <div 
                      key={`${point.id}-${index}`}
                      className="flex items-start gap-4 p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-amber-500/30 transition-all hover:bg-slate-900 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors">
                        {point.id}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-200 leading-tight">
                          {point.title.split(' (')[0]}
                        </span>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1 bg-blue-500/10 px-2 py-0.5 rounded w-fit">
                          {point.period}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!data?.progress?.[0]?.pendingPoints || data?.progress?.[0]?.pendingPoints.length === 0) && (
                    <div className="col-span-full py-20 flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                        <CheckCircle2 className="text-green-500 w-12 h-12 underline-offset-4" />
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white tracking-tight">¡Dossier al Corriente!</p>
                        <p className="text-slate-400 mt-2">No hay requerimientos pendientes para los periodos activos.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl max-w-2xl text-center">
            <p className="text-xs text-blue-400 font-medium">
              Este dashboard muestra información resumida de cumplimiento. Los detalles específicos están resguardados bajo políticas de confidencialidad de RECAL Corporativo.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
            <p>© 2026 hse_dossier_recal | Desarrollado por <a href="https://servitec-tonala.es" className="text-blue-500 hover:underline">SERVITEC</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, subtitle }) {
  return (
    <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl hover:border-slate-700/50 transition-all group overflow-hidden relative">
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24 text-white" />
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500">
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{subtitle}</span>
      </div>
      <div>
        <h4 className="text-slate-400 text-sm font-medium mb-1">{title}</h4>
        <p className="text-4xl font-extrabold text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}
