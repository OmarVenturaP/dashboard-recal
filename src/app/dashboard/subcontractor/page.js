"use client";
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Save, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  X,
  Shield,
  Activity,
  Calendar
} from 'lucide-react';

export default function SubcontractorDashboard() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const monthNames = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const physicalStatusColors = {
    'Liberado': 'bg-green-500/10 text-green-500 border-green-500/20',
    'Atn. de Observaciones': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'No entregado': 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  async function fetchAllDossiers() {
    setLoading(true);
    try {
      const res = await fetch('/api/dossiers');
      const data = await res.json();
      setDossiers(data || []);
    } catch (error) {
      console.error('Error fetching subcontractor dossiers:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllDossiers();
  }, []);

  const openDossier = (dossier) => {
    setSelectedDossier(dossier);
    setChecklist(dossier.checklist_json || []);
    setIsModalOpen(true);
    setSaveStatus(null);
  };

  const handleToggleItem = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
    setSaveStatus(null);
  };

  const handleSave = async () => {
    if (!selectedDossier) return;
    
    setSaving(true);
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
        // Actualizar la lista local
        setDossiers(prev => prev.map(d => 
          d.id === selectedDossier.id 
            ? { 
                ...d, 
                checklist_json: checklist, 
                physical_status: selectedDossier.physical_status,
                progress_percentage: (checklist.filter(i => i.completed).length / checklist.length) * 100 
              }
            : d
        ));
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedDossier(null);
        }, 800);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Agrupar dossiers por mes/año para las tarjetas
  const groupedPeriods = dossiers.reduce((acc, d) => {
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

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Control de Dossiers</h1>
          <p className="text-slate-400 mt-2 text-lg">Gestión de cumplimiento por periodos mensuales</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{dossiers.length} Dossiers Activos</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Digital vs Físico</p>
        </div>
      </div>

      {/* Cards Grid */}
      {sortedPeriods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedPeriods.map((period, idx) => (
            <div key={idx} className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl hover:border-slate-700 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calendar size={120} />
              </div>
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white">
                  {monthNames[period.month]} <span className="text-slate-500 font-medium">{period.year}</span>
                </h3>
              </div>

              <div className="space-y-6 relative z-10">
                {/* Seguridad Button/Block */}
                {period.security && (
                  <button 
                    onClick={() => openDossier(period.security)}
                    className="w-full text-left p-6 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all hover:bg-slate-800/80 group/btn"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className="text-xs font-black uppercase text-slate-400 tracking-widest group-hover/btn:text-blue-400 transition-colors">Seguridad</span>
                      </div>
                      <span className="text-sm font-black text-white">{Math.round(period.security.progress_percentage)}%</span>
                    </div>
                    
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-4">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${period.security.progress_percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Dossier Físico:</span>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${physicalStatusColors[period.security.physical_status] || physicalStatusColors['No entregado']}`}>
                        {period.security.physical_status || 'No entregado'}
                      </span>
                    </div>
                  </button>
                )}

                {/* Ambiental Button/Block */}
                {period.environmental && (
                  <button 
                    onClick={() => openDossier(period.environmental)}
                    className="w-full text-left p-6 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all hover:bg-slate-800/80 group/btn"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-black uppercase text-slate-400 tracking-widest group-hover/btn:text-emerald-400 transition-colors">Ambiental</span>
                      </div>
                      <span className="text-sm font-black text-white">{Math.round(period.environmental.progress_percentage)}%</span>
                    </div>
                    
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-4">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${period.environmental.progress_percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Dossier Físico:</span>
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
      ) : (
        <div className="py-40 text-center bg-[#0f172a] border border-slate-800 rounded-[3rem] shadow-xl space-y-6">
          <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800 shadow-inner">
            <AlertCircle className="w-12 h-12 text-slate-700" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-white tracking-tight">Sin periodos asignados</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto text-lg leading-relaxed">
              El administrador aún no ha habilitado periodos de entrega para su cuenta. 
            </p>
          </div>
        </div>
      )}

      {/* Modal Checklist */}
      {isModalOpen && selectedDossier && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl sticky top-0 z-20">
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-3xl ${selectedDossier.type === 'seguridad' ? 'bg-blue-600/10 text-blue-500' : 'bg-emerald-600/10 text-emerald-500'} shadow-inner`}>
                  {selectedDossier.type === 'seguridad' ? <Shield size={28} /> : <Activity size={28} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Dossier de {selectedDossier.type.toUpperCase()}</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Periodo: {monthNames[selectedDossier.month]} {selectedDossier.year}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all active:scale-90 shadow-lg"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content - Dual Section */}
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
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Requerimientos Digitales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {checklist.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`flex items-start gap-4 p-5 rounded-3xl border transition-all cursor-pointer group ${
                        item.completed 
                          ? (selectedDossier.type === 'seguridad' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-emerald-600/10 border-emerald-500/30')
                          : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`mt-1 shrink-0 ${
                        item.completed 
                          ? (selectedDossier.type === 'seguridad' ? 'text-blue-500' : 'text-emerald-500') 
                          : 'text-slate-700 group-hover:text-slate-500'
                      }`}>
                        {item.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-bold leading-tight ${item.completed ? 'text-white' : 'text-slate-500'}`}>
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider mt-1">{item.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-800 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-3xl font-black text-white">
                    {Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100)}%
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
                onClick={handleSave}
                disabled={saving}
                className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                  saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30'
                }`}
              >
                {saving ? <Loader2 className="animate-spin" /> : (
                  saveStatus === 'success' ? <CheckCircle2 /> : <Save />
                )}
                {saveStatus === 'success' ? '¡Actualizado!' : 'Guardar Progreso Todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
