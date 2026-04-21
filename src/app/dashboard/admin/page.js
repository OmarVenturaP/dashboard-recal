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
  Cell
} from 'recharts';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  Shield,
  Activity,
  Calendar,
  Circle,
  Save,
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function AdminDashboard() {
  const [dossierType, setDossierType] = useState('seguridad');
  const [selectedSub, setSelectedSub] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null);
  const [tempTitle, setTempTitle] = useState("");

  const monthNames = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const physicalStatusColors = {
    'Liberado': 'bg-green-500/10 text-green-500 border-green-500/20',
    'Atn. de Observaciones': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'No entregado': 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  async function fetchStats() {
    setLoading(true);
    try {
      const url = selectedSub === 'all' 
        ? `/api/public/stats?type=${dossierType}&subcontractorId=all`
        : `/api/dossiers?subcontractorId=${selectedSub}`;
      
      const res = await fetch(url);
      const stats = await res.json();
      
      if (selectedSub === 'all') {
        setData(stats);
      } else {
        // En vista detallada por contratista, 'stats' es la lista de dossiers (histórico)
        setData(prev => ({
          ...prev,
          subcontractorHistory: stats,
          selectedSubDetails: stats.length > 0 ? { 
            name: stats[0].subcontractor_name,
            id: selectedSub
          } : { name: 'Empresa sin periodos', id: selectedSub }
        }));
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, [dossierType, selectedSub]);

  const openDossier = (dossier) => {
    setSelectedDossier(dossier);
    setChecklist(dossier.checklist_json || []);
    setIsModalOpen(true);
    setSaveStatus(null);
    setEditingPoint(null);
  };

  const handleToggleItem = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
    setSaveStatus(null);
  };

  const handleRename = async (pointId) => {
    if (!tempTitle.trim()) return;
    setChecklist(prev => prev.map(item => 
      item.id === pointId ? { ...item, title: tempTitle.trim() } : item
    ));
    setEditingPoint(null);
  };

  const handleSaveModal = async () => {
    if (!selectedDossier) return;
    setUpdating(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dossierId: selectedDossier.id,
          checklistData: checklist,
          physicalStatus: selectedDossier.physical_status
        })
      });
      
      if (res.ok) {
        setSaveStatus('success');
        await fetchStats(); // Recargar para actualizar tarjetas y gráficas
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedDossier(null);
        }, 800);
      }
    } catch (error) {
      console.error('Error saving audit:', error);
      setSaveStatus('error');
    } finally {
      setUpdating(false);
    }
  };

  // Agrupar dossiers por mes/año para las tarjetas (Misma lógica que Subcontractor)
  const groupedPeriods = (data?.subcontractorHistory || []).reduce((acc, d) => {
    const key = `${d.month}-${d.year}`;
    if (!acc[key]) {
      acc[key] = { month: d.month, year: d.year, security: null, environmental: null };
    }
    if (d.type === 'seguridad') acc[key].security = d;
    else acc[key].environmental = d;
    return acc;
  }, {});

  const sortedPeriods = Object.values(groupedPeriods).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  if (!mounted || (loading && !data)) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Top Section: Title & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Filter className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Panel Master</h1>
            <p className="text-slate-400 text-sm">Supervisión Global de Periodos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Dossier Toggle (Solo visible en Vista Global para filtrar gráficas) */}
          {selectedSub === 'all' && (
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 min-w-[200px]">
              <button
                onClick={() => setDossierType('seguridad')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  dossierType === 'seguridad' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'
                }`}
              >
                Seguridad
              </button>
              <button
                onClick={() => setDossierType('ambiental')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  dossierType === 'ambiental' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'
                }`}
              >
                Ambiental
              </button>
            </div>
          )}

          {/* Subcontractor Selector */}
          <select
            value={selectedSub}
            onChange={(e) => setSelectedSub(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl p-3 outline-none hover:border-slate-700 transition-colors min-w-[220px]"
          >
            <option value="all">Todas las Contratistas (Vista Global)</option>
            {data?.subcontractors?.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedSub === 'all' ? (
        /* Vista Resumen (Gráficas + Tabla) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              <TrendingUp className="text-blue-500 w-6 h-6" />
              Estatus de Cumplimiento ({dossierType.toUpperCase()})
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.progress || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" />
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

          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">Métricas Globales</h3>
            <div className="space-y-6">
              <MetricItem label="Cumplimiento Digital" value={`${Math.round(data?.kpis?.avg_compliance || 0)}%`} icon={CheckCircle2} />
              <MetricItem label="Dossieres Físicos" value={`${data?.progress?.reduce((acc, c) => acc + (c.physical_released || 0), 0)} Liberados`} icon={FileText} />
              <MetricItem label="Empresas Activas" value={data?.kpis?.total_active_contractors} icon={Users} />
            </div>
          </div>

          <div className="lg:col-span-3 bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
              <h3 className="text-xl font-bold text-white">Estatus por Contratista</h3>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{data?.progress?.length} Empresas Registradas</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contratista</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Periodos</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Avance Digital</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Dossier Físico</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data?.progress?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold border border-blue-500/20 text-[10px]">
                            {row.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-white whitespace-nowrap">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold border border-slate-700">
                          {row.active_count || 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-800 h-1.5 rounded-full min-w-[60px]">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${row.progress > 80 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                              style={{ width: `${row.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-black text-white">{Math.round(row.progress)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                           <span className="text-[9px] font-black text-slate-500 uppercase">{row.physical_released || 0} Liberados</span>
                           <div className="flex gap-0.5">
                              {Array.from({length: 3}).map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < row.physical_released ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                              ))}
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            const found = data.subcontractors?.find(s => s.name === row.name);
                            if (found) setSelectedSub(found.id);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-slate-700"
                        >
                          Auditar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Vista de Tarjetas Mensuales por Contratista (Unificada) */
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">{data?.selectedSubDetails?.name}</h2>
              <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                <FileText size={14} className="text-blue-500" /> Historial de Requerimientos Mensuales
              </p>
            </div>
            <button 
              onClick={() => setSelectedSub('all')}
              className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
            >
              &larr; Volver a Vista Global
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedPeriods.map((period, idx) => (
              <div key={idx} className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl hover:border-slate-700 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Calendar size={120} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-8">
                  {monthNames[period.month]} <span className="text-slate-500 font-medium">{period.year}</span>
                </h3>

                <div className="space-y-6 relative z-10">
                  {period.security && (
                    <button 
                      onClick={() => openDossier(period.security)}
                      className="w-full text-left p-6 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-blue-500 transition-all hover:bg-slate-800/80 group/btn"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Shield className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Seguridad</span>
                        </div>
                        <span className="text-sm font-black text-white">{Math.round(period.security.progress_percentage)}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-4">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${period.security.progress_percentage}%` }}></div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Físico:</span>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${physicalStatusColors[period.security.physical_status] || physicalStatusColors['No entregado']}`}>
                          {period.security.physical_status || 'No entregado'}
                        </span>
                      </div>
                    </button>
                  )}

                  {period.environmental && (
                    <button 
                      onClick={() => openDossier(period.environmental)}
                      className="w-full text-left p-6 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-emerald-500 transition-all hover:bg-slate-800/80 group/btn"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Activity className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Ambiental</span>
                        </div>
                        <span className="text-sm font-black text-white">{Math.round(period.environmental.progress_percentage)}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-4">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${period.environmental.progress_percentage}%` }}></div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Físico:</span>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${physicalStatusColors[period.environmental.physical_status] || physicalStatusColors['No entregado']}`}>
                          {period.environmental.physical_status || 'No entregado'}
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {sortedPeriods.length === 0 && (
            <div className="py-24 text-center bg-[#0f172a] border border-slate-800 rounded-3xl">
               <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sin periodos habilitados aún</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Auditoría / Gestión */}
      {isModalOpen && selectedDossier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 sticky top-0 z-20">
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-3xl ${selectedDossier.type === 'seguridad' ? 'bg-blue-600/10 text-blue-500' : 'bg-emerald-600/10 text-emerald-500'}`}>
                  {selectedDossier.type === 'seguridad' ? <Shield size={28} /> : <Activity size={28} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Auditoría: {selectedDossier.type.toUpperCase()}</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{data?.selectedSubDetails?.name} • {monthNames[selectedDossier.month]} {selectedDossier.year}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 border-b border-slate-800 bg-slate-950/20">
                <div className="max-w-sm">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Estatus del Dossier Físico</label>
                  <select 
                    value={selectedDossier.physical_status || 'No entregado'}
                    onChange={(e) => setSelectedDossier({...selectedDossier, physical_status: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="No entregado">🔴 No entregado</option>
                    <option value="Atn. de Observaciones">🟡 Atn. de Observaciones</option>
                    <option value="Liberado">🟢 Liberado</option>
                  </select>
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Auditoría Requerimientos Digitales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checklist.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-start gap-4 p-5 rounded-3xl border transition-all ${
                      item.completed 
                        ? (selectedDossier.type === 'seguridad' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-emerald-600/10 border-emerald-500/30')
                        : 'bg-slate-900/30 border-slate-800'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleItem(item.id)}
                      className={`mt-1 shrink-0 ${
                        item.completed 
                          ? (selectedDossier.type === 'seguridad' ? 'text-blue-500' : 'text-emerald-500') 
                          : 'text-slate-700'
                      }`}
                    >
                      {item.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div className="flex-1">
                      {editingPoint === item.id ? (
                        <div className="space-y-2">
                          <input
                            autoFocus
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(item.id)}
                            className="w-full bg-slate-800 border border-blue-500 text-white p-2 rounded-lg text-sm outline-none"
                          />
                          <div className="flex gap-2">
                             <button onClick={() => handleRename(item.id)} className="text-[10px] bg-blue-600 px-2 py-1 rounded text-white">OK</button>
                             <button onClick={() => setEditingPoint(null)} className="text-[10px] bg-slate-700 px-2 py-1 rounded text-white">X</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between group/audit">
                           <h4 className={`text-sm font-bold leading-tight ${item.completed ? 'text-white' : 'text-slate-500'}`}>
                            {item.title}
                          </h4>
                          <button 
                            onClick={() => { setEditingPoint(item.id); setTempTitle(item.title); }}
                            className="opacity-0 group-hover/audit:opacity-100 p-1 text-slate-500 hover:text-blue-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

            <div className="p-8 border-t border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-3xl font-black text-white">
                    {Math.round((checklist.filter(i => i.completed).length / (checklist.length || 1)) * 100)}%
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avance Digital</div>
                </div>
                <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>
                <div className="flex flex-col">
                   <div className="text-sm font-bold text-white">{selectedDossier.physical_status || 'No entregado'}</div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estatus Físico</div>
                </div>
              </div>
              
              <button
                onClick={handleSaveModal}
                disabled={updating}
                className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                  saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                }`}
              >
                {updating ? <Loader2 className="animate-spin" /> : (
                  saveStatus === 'success' ? <CheckCircle2 /> : <Save />
                )}
                {saveStatus === 'success' ? 'Auditado con éxito' : 'Guardar Auditoría'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricItem({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
      <div className="p-3 bg-blue-600/10 rounded-xl text-blue-500">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</div>
        <div className="text-xl font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, trend, color, isAlert }) {
  return (
    <div className={`bg-[#0f172a] border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all group`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${
          isAlert ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-600/10 text-blue-500'
        } group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{trend}</div>
      </div>
      <div>
        <h4 className="text-slate-400 text-sm font-medium mb-1">{title}</h4>
        <p className="text-3xl font-extrabold text-white">{value}</p>
      </div>
    </div>
  );
}
