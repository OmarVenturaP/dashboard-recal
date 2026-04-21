"use client";
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Shield, 
  Activity, 
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  Info
} from 'lucide-react';

export default function PeriodsCalendar() {
  const [subcontractors, setSubcontractors] = useState([]);
  const [selectedSub, setSelectedSub] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // id del mes_tipo que se está actualizando

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const years = [2023, 2024, 2025, 2026];

  async function loadInitialData() {
    try {
      const res = await fetch('/api/public/stats?type=seguridad&subcontractorId=all');
      const data = await res.json();
      setSubcontractors(data.subcontractors || []);
      if (data.subcontractors?.length > 0) {
        setSelectedSub(data.subcontractors[0].id);
      }
    } catch (error) {
      console.error('Error loading subcontractors:', error);
    }
  }

  async function fetchPeriods() {
    if (!selectedSub || !selectedYear) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/periods?subcontractorId=${selectedSub}&year=${selectedYear}`);
      const data = await res.json();
      setPeriods(data);
    } catch (error) {
      console.error('Error fetching periods:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [selectedSub, selectedYear]);

  const handleToggle = async (month, currentState) => {
    setUpdating(month);
    try {
      const res = await fetch('/api/admin/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcontractorId: selectedSub,
          year: selectedYear,
          month,
          isActive: !currentState
        })
      });

      if (res.ok) {
        fetchPeriods();
      }
    } catch (error) {
      console.error('Error toggling period:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getMonthStatus = (month) => {
    // Si existe al menos uno activo, consideramos el mes activo para el demo unificado
    return periods.some(p => p.month === month && p.is_active);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Calendar size={120} />
        </div>
        
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex flex-col md:flex-row items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
              <Calendar className="w-6 h-6" />
            </div>
            Gestión Anual de Requerimientos
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed mx-auto md:mx-0">
            Selecciona los meses de trabajo para la contratista. Al activar un mes, se habilitarán automáticamente los dossiers de **Seguridad** y **Ambiental**.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {/* Subcontractor Selector */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-blue-500 tracking-widest flex items-center gap-1.5 ml-1">
              <Users size={12} /> Contratista Seleccionada
            </label>
            <select
              value={selectedSub}
              onChange={(e) => setSelectedSub(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
            >
              {subcontractors.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-blue-500 tracking-widest flex items-center gap-1.5 ml-1">
              <Activity size={12} /> Ejercicio Fiscal / Año
            </label>
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    selectedYear === year 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
        </div>
      ) : (
        /* Calendar Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {monthNames.map((monthName, i) => {
            const monthIdx = i + 1;
            const isActive = getMonthStatus(monthIdx);

            return (
              <div 
                key={monthName}
                className={`bg-[#0f172a] border rounded-3xl p-6 shadow-lg transition-all flex flex-col gap-6 group hover:scale-[1.02] ${
                   isActive ? 'border-blue-500/30' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {monthName}
                  </h3>
                  <div className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${
                    isActive ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-600'
                  }`}>
                    {isActive ? 'Activo' : 'Inactivo'}
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(monthIdx, isActive)}
                  disabled={updating === monthIdx}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-500' 
                      : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {updating === monthIdx ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      {isActive ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-700" />}
                      {isActive ? 'Mes Habilitado' : 'Habilitar Mes'}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <Shield size={12} /> Seg
                   </div>
                   <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <Activity size={12} /> Amb
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
