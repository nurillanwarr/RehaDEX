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
  const [selectedSides, setSelectedSides] = useState<HandSide[]>([defaultSide]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'fleksi' | 'ekstensi'>('all');
  const [finger, setFinger] = useState<FingerNo>(1);

  const toggleSide = (s: HandSide) => {
    setSelectedSides(prev => {
      if (prev.includes(s)) {
        return prev.length > 1 ? prev.filter(x => x !== s) : prev;
      }
      const next = [...prev, s];
      return (['R', 'L'] as HandSide[]).filter(x => next.includes(x));
    });
  };

  const seriesR = data?.R?.[finger] ?? [];
  const seriesL = data?.L?.[finger] ?? [];

  // Gabungkan bulan/sesi dari tangan yang dipilih
  const monthOrder: string[] = [];
  if (selectedSides.includes('R')) {
    for (const pt of seriesR) {
      if (!monthOrder.includes(pt.month)) monthOrder.push(pt.month);
    }
  }
  if (selectedSides.includes('L')) {
    for (const pt of seriesL) {
      if (!monthOrder.includes(pt.month)) monthOrder.push(pt.month);
    }
  }

  const combinedSeries = monthOrder.map(m => {
    const ptR = seriesR.find(x => x.month === m);
    const ptL = seriesL.find(x => x.month === m);
    return {
      month: m,
      fleksiR: ptR ? (movementNo === 1 ? (ptR.flexionG1 ?? ptR.avgFlexion) : (ptR.flexionG2 ?? ptR.avgFlexion)) : undefined,
      ekstensiR: ptR ? (movementNo === 1 ? (ptR.extensionG1 ?? ptR.avgExtension) : (ptR.extensionG2 ?? ptR.avgExtension)) : undefined,
      fleksiL: ptL ? (movementNo === 1 ? (ptL.flexionG1 ?? ptL.avgFlexion) : (ptL.flexionG2 ?? ptL.avgFlexion)) : undefined,
      ekstensiL: ptL ? (movementNo === 1 ? (ptL.extensionG1 ?? ptL.avgExtension) : (ptL.extensionG2 ?? ptL.avgExtension)) : undefined,
    };
  });

  const bothSelected = selectedSides.length === 2;

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

        {/* 2. Pilih Sisi Tangan (Bisa pilih 1 atau keduanya) & 3. Pilih Fleksi / Ekstensi */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-3 sm:flex gap-2">
            {(['R', 'L'] as HandSide[]).map(s => {
              const active = selectedSides.includes(s);
              return (
                <button
                  key={s}
                  id={`btn-side-${s}`}
                  type="button"
                  onClick={() => toggleSide(s)}
                  className={`px-3 py-1.5 rounded-lg border-2 font-bold text-xs sm:text-sm transition ${
                    active
                      ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-sm'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-[#1e3a8a]'
                  }`}
                >
                  {active ? '✓ ' : ''}
                  {s === 'R' ? 'Kanan (R)' : 'Kiri (L)'}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedSides(['R', 'L'])}
              className={`px-3 py-1.5 rounded-lg border-2 font-bold text-xs sm:text-sm transition ${
                bothSelected
                  ? 'bg-blue-900 border-blue-900 text-white shadow-sm'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900'
              }`}
            >
              {bothSelected ? '✓ Keduanya' : 'Keduanya (R & L)'}
            </button>
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
            Gerakan {movementNo} • Tangan{' '}
            {selectedSides.map(s => (s === 'R' ? 'Kanan (R)' : 'Kiri (L)')).join(' & ')} • Jari{' '}
            {finger} ({FINGER_NAMES[finger]})
          </div>

          <div className="h-64 sm:h-72">
            {combinedSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Belum ada data untuk jari ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedSeries} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
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
                  {selectedSides.includes('R') && (typeFilter === 'all' || typeFilter === 'fleksi') && (
                    <Line
                      type="monotone"
                      name={bothSelected ? `Fleksi Kanan (R)` : `Fleksi (Gerakan ${movementNo})`}
                      dataKey="fleksiR"
                      stroke="#dc2626"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                  {selectedSides.includes('R') && (typeFilter === 'all' || typeFilter === 'ekstensi') && (
                    <Line
                      type="monotone"
                      name={bothSelected ? `Ekstensi Kanan (R)` : `Ekstensi (Gerakan ${movementNo})`}
                      dataKey="ekstensiR"
                      stroke="#84cc16"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                  {selectedSides.includes('L') && (typeFilter === 'all' || typeFilter === 'fleksi') && (
                    <Line
                      type="monotone"
                      name={bothSelected ? `Fleksi Kiri (L)` : `Fleksi (Gerakan ${movementNo})`}
                      dataKey="fleksiL"
                      stroke={bothSelected ? '#2563eb' : '#dc2626'}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                  {selectedSides.includes('L') && (typeFilter === 'all' || typeFilter === 'ekstensi') && (
                    <Line
                      type="monotone"
                      name={bothSelected ? `Ekstensi Kiri (L)` : `Ekstensi (Gerakan ${movementNo})`}
                      dataKey="ekstensiL"
                      stroke={bothSelected ? '#f59e0b' : '#84cc16'}
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
