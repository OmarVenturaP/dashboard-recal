"use client";
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // En un componente cliente real de Next.js deberíamos manejar el estado del usuario
  // Para este demo, usaremos una lógica simple de lectura de cookies o similar
  const [userRole, setUserRole] = useState('admin'); // Default para el layout

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/admin', role: 'admin' },
    { name: 'Gestión de Periodos', icon: Calendar, path: '/dashboard/admin/periods', role: 'admin' },
    { name: 'Control de Dossiers', icon: FileCheck2, path: '/dashboard/subcontractor', role: 'subcontractor' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-[#0f172a] border-r border-slate-800 z-50 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-8 py-8 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Dashboard Dossier</span>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                router.push(item.path);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                ${pathname === item.path 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-20 bg-[#020617]/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 text-slate-400 hover:bg-slate-800 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Dashboard</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold">
              A
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8">
          {children}
        </div>

        {/* Footer with Branding and Disclaimer */}
        <footer className="p-8 border-t border-slate-800 text-center space-y-4">
          <div className="bg-blue-900/10 border border-blue-800/30 p-4 rounded-2xl max-w-2xl mx-auto">
          </div>
          <div className="text-slate-500 text-sm">
            <p>© 2026 Dashboard dossier | Un producto de <a href="https://obras-os.vercel.app/" className="text-blue-500 hover:underline">Obras-OS</a></p>
            <p className="mt-2">
              Diseñado por{" "}
              <a 
                href="https://servitec-tonala.es" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline font-medium"
              >
                SERVITEC
              </a>
            </p>
            <p className="text-[10px] text-slate-600 mt-2 italic">obras-os.com (Próximamente)</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
