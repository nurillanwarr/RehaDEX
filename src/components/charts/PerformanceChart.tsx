"use client";

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PerformanceSummary } from '@/data/dummyData';

interface PerformanceChartProps {
  data: PerformanceSummary[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const [movementNo, setMovementNo] = useState<1 | 2>(1);
  const [typeFilter, setTypeFilter] = useState<'all' | 'fleksi' | 'ekstensi'>('all');

  const series = data.map(pt => ({
    month: pt.month,
    fleksiVal: movementNo === 1 ? (pt.flexionG1 ?? pt.avgFlexion) : (pt.flexionG2 ?? pt.avgFlexion),
    ekstensiVal: movementNo === 1 ? (pt.extensionG1 ?? pt.avgExtension) : (pt.extensionG2 ?? pt.avgExtension),
  }));

  return (
    <div className="w-full bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Grafik Performa per Bulan</h3>
          <div className="flex gap-1.5">
            {([1, 2] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMovementNo(m)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                  movementNo === m
                    ? 'bg-[#12aca7] border-[#12aca7] text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-[#12aca7]'
                }`}
              >
                Gerakan {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5">
          {(
            [
              { key: 'all', label: 'Semua' },
              { key: 'fleksi', label: 'Fleksi' },
              { key: 'ekstensi', label: 'Ekstensi' },
            ] as const
          ).map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTypeFilter(item.key)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                typeFilter === item.key
                  ? item.key === 'fleksi'
                    ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white'
                    : item.key === 'ekstensi'
                    ? 'bg-[#10b981] border-[#10b981] text-white'
                    : 'bg-gray-800 border-gray-800 text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series}
            margin={{
              top: 10,
              right: 15,
              left: -10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" />
            {(typeFilter === 'all' || typeFilter === 'fleksi') && (
              <Line
                type="monotone"
                name={`Fleksi (Gerakan ${movementNo})`}
                dataKey="fleksiVal"
                stroke="#1e3a8a"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 8 }}
              />
            )}
            {(typeFilter === 'all' || typeFilter === 'ekstensi') && (
              <Line
                type="monotone"
                name={`Ekstensi (Gerakan ${movementNo})`}
                dataKey="ekstensiVal"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
