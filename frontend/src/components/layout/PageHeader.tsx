import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon }: PageHeaderProps) {
  return (
    <div className="w-full bg-gradient-to-r from-[#213e8a] to-[#12aca7] rounded-xl p-5 text-white shadow-md mb-6 flex items-center relative overflow-hidden">
      {/* Dekorasi tipis di background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
      
      {icon && (
        <div className="bg-white/20 p-3 rounded-lg mr-4 backdrop-blur-sm">
          {icon}
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wider">{title}</h1>
        {subtitle && <p className="text-sm text-blue-100 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
