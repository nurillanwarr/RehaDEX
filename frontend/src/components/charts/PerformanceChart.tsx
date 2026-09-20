"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PerformanceSummary } from '@/data/dummyData';

interface PerformanceChartProps {
  data: PerformanceSummary[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Grafik Performa Rata-rata per Bulan</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" tick={{fill: '#6b7280'}} />
          <YAxis stroke="#6b7280" tick={{fill: '#6b7280'}} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" />
          <Line type="monotone" name="Rata-rata Fleksi" dataKey="avgFlexion" stroke="#1e3a8a" strokeWidth={3} activeDot={{ r: 8 }} />
          <Line type="monotone" name="Rata-rata Ekstensi" dataKey="avgExtension" stroke="#10b981" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
