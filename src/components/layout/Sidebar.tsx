"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Activity, FileText, Settings, LogOut, FilePlus, Home, X } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItemClass = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));
    return `flex items-center space-x-3 px-4 py-2.5 rounded-xl transition ${
      isActive 
        ? 'bg-[#4375ff] text-white shadow-md' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
    }`;
  };

  const iconColor = (path: string, defaultColor: string) => {
    const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));
    return isActive ? 'text-white' : defaultColor;
  };

  return (
    <div className="w-[280px] bg-white border-r border-gray-200 h-screen flex flex-col shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10">
      {/* Logo Area */}
      <div className="flex items-center justify-between px-6 py-6 mb-2">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center mr-3 shadow-sm border-2 border-blue-900">
            <div className="w-4 h-4 bg-blue-900 rounded-sm rotate-45"></div>
          </div>
          <span className="font-bold text-xl text-[#1e293b] tracking-wide">FISIO<span className="text-[#4375ff]">TERAPI</span></span>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin">
        {/* Section 1 */}
        <div className="mb-6">
          <p className="px-4 text-xs font-bold text-gray-400 mb-3 tracking-wider">UTAMA</p>
          <div className="space-y-1">
            <Link href="/" className={navItemClass('/')}>
              <Home size={18} className={iconColor('/', 'text-[#4375ff]')} />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Section 2 */}
        <div className="mb-6">
          <p className="px-4 text-xs font-bold text-gray-400 mb-3 tracking-wider">DATA PASIEN</p>
          <div className="space-y-1">
            <Link href="/patient/STK-001" className={navItemClass('/patient/STK-001')}>
              <User size={18} className={iconColor('/patient/STK-001', 'text-[#10b981]')} />
              <span className="text-sm font-medium">Profil Pasien</span>
            </Link>
          </div>
        </div>

        {/* Section 3 */}
        <div className="mb-6">
          <p className="px-4 text-xs font-bold text-gray-400 mb-3 tracking-wider">TERAPI & DIAGNOSA</p>
          <div className="space-y-1">
            <Link href="/patient/STK-001/diagnosa" className={navItemClass('/patient/STK-001/diagnosa')}>
              <FilePlus size={18} className={iconColor('/patient/STK-001/diagnosa', 'text-[#f59e0b]')} />
              <span className="text-sm font-medium">Mulai Sesi Baru</span>
            </Link>
            <Link href="/patient/STK-001/assesmen" className={navItemClass('/patient/STK-001/assesmen')}>
              <FileText size={18} className={iconColor('/patient/STK-001/assesmen', 'text-[#ef4444]')} />
              <span className="text-sm font-medium">Input Assesmen</span>
            </Link>
            <Link href="/patient/STK-001/mode" className={navItemClass('/patient/STK-001/mode')}>
              <Activity size={18} className={iconColor('/patient/STK-001/mode', 'text-[#8b5cf6]')} />
              <span className="text-sm font-medium">Mode Alat IoT</span>
            </Link>
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-[#f0f4ff] rounded-xl p-3 flex items-center justify-between border border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-200 overflow-hidden border border-white shadow-sm flex items-center justify-center text-blue-700 font-bold">
              DR
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">DR. Fisioterapis</p>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Admin Medis</p>
            </div>
          </div>
          <button className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-100 transition">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
