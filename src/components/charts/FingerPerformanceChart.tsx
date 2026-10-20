"use client";

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FingerPerformance, FingerNo, HandSide } from '@/data/dummyData';

const FINGER_NAMES: Record<FingerNo, string> = {
  1: 'Ibu Jari',
  2: 'Telunjuk',
  3: 'Tengah',
  4: 'Manis',
  5: 'Kelingking',
};

interface Props {
  data?: FingerPerformance;
  defaultSide?: HandSide;
}

export default function FingerPerformanceChart({ data, defaultSide = 'R' }: Props) {
  const [movementNo, setMovementNo] = useState<1 | 2>(1);
  const [side, setSide] = useState<HandSide>(defaultSide);
  const [typeFilter, setTypeFilter] = useState<'all' | 'fleksi' | 'ekstensi'>('all');
  const [finger, setFinger] = useState<FingerNo>(1);

  const rawSeries = data?.[side]?.[finger] ?? [];
  const series = rawSeries.map(pt => ({
    month: pt.month,
    fleksiVal: movementNo === 1 ? (pt.flexionG1 ?? pt.avgFlexion) : (pt.flexionG2 ?? pt.avgFlexion),
    ekstensiVal: movementNo === 1 ? (pt.extensionG1 ?? pt.avgExtension) : (pt.extensionG2 ?? pt.avgExtension),
  }));

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            Grafik Performa per Jari
          </h3>
          {/* 1. Pilih Gerakan 1 / Gerakan 2 */}
          <div className="grid grid-cols-2 sm:flex gap-2">
            {([1, 2] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMovementNo(m)}
                className={`px-3.5 py-1.5 rounded-lg border-2 font-bold text-xs sm:text-sm transition ${
                  movementNo === m
                    ? 'bg-[#12aca7] border-[#12aca7] text-white shadow-sm'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-[#12aca7]'
                }`}
              >
                Gerakan {m}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Pilih Sisi Tangan (R/L) & 3. Pilih Fleksi / Ekstensi */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 sm:flex gap-2">
            {(['R', 'L'] as HandSide[]).map(s => (
              <button
                key={s}
                id={`btn-side-${s}`}
                type="button"
                onClick={() => setSide(s)}
                className={`px-4 py-1.5 rounded-lg border-2 font-bold text-xs sm:text-sm transition ${
                  side === s
                    ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-sm'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-[#1e3a8a]'
                }`}
              >
                {s === 'R' ? 'Tangan Kanan (R)' : 'Tangan Kiri (L)'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:flex gap-1.5">
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
                className={`px-3 py-1.5 rounded-lg border font-semibold text-xs transition ${
                  typeFilter === item.key
                    ? item.key === 'fleksi'
                      ? 'bg-red-600 border-red-600 text-white'
                      : item.key === 'ekstensi'
                      ? 'bg-lime-600 border-lime-600 text-white'
                      : 'bg-gray-800 border-gray-800 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Pemilih jari 1-5 */}
        <div className="grid grid-cols-5 sm:flex sm:flex-col gap-2">
          {([1, 2, 3, 4, 5] as FingerNo[]).map(f => (
            <button
              key={f}
              id={`btn-finger-${f}`}
              type="button"
              onClick={() => setFinger(f)}
              title={FINGER_NAMES[f]}
              className={`min-w-[44px] h-10 sm:h-11 rounded-lg border-2 font-bold text-sm transition ${
                finger === f
                  ? 'bg-[#12aca7] border-[#12aca7] text-white shadow'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-[#12aca7]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-2 text-xs sm:text-sm font-semibold text-gray-700">
            Gerakan {movementNo} • Tangan {side === 'R' ? 'Kanan' : 'Kiri'} • Jari {finger} ({FINGER_NAMES[finger]})
          </div>

          <div className="h-64 sm:h-72">
            {series.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Belum ada data untuk jari ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend iconType="circle" />
                  {(typeFilter === 'all' || typeFilter === 'fleksi') && (
                    <Line
                      type="monotone"
                      name={`Fleksi (Gerakan ${movementNo})`}
                      dataKey="fleksiVal"
                      stroke="#dc2626"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                  {(typeFilter === 'all' || typeFilter === 'ekstensi') && (
                    <Line
                      type="monotone"
                      name={`Ekstensi (Gerakan ${movementNo})`}
                      dataKey="ekstensiVal"
                      stroke="#84cc16"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
