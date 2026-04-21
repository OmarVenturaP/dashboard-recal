"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirigir según el rol
        if (data.user.role === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/subcontractor');
        }
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden px-4">
      {/* Background Orbs for Deep Blue Aesthetic */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <Shield className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">HSE Recal</h1>
            <p className="text-slate-400 mt-2 text-center text-sm">
              Gestión Avanzada de Dossiers de Seguridad
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm mb-6 flex items-center animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email Corporativo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="name@recal.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Desarrollado por SERVITEC
            </p>
            <a 
              href="https://servitec-tonala.es" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 text-sm hover:underline mt-1 inline-block"
            >
              www.servitec-tonala.es
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
