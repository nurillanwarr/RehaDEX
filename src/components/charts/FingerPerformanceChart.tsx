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
  const [side, setSide] = useState<HandSide>(defaultSide);
  const [finger, setFinger] = useState<FingerNo>(1);

  const series = data?.[side]?.[finger] ?? [];
  const first = series[0];
  const last = series[series.length - 1];
  const delta = first && last ? +(last.avgFlexion - first.avgFlexion).toFixed(1) : 0;

  const sideBtn = (s: HandSide, label: string) => (
    <button
      key={s}
      id={`btn-side-${s}`}
      onClick={() => setSide(s)}
      className={`px-5 py-1.5 rounded-lg border-2 font-bold text-sm transition ${
        side === s
          ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow'
          : 'bg-white border-gray-300 text-gray-600 hover:border-[#1e3a8a]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Grafik Performa per Jari</h3>
        <div className="flex gap-2">
          {sideBtn('R', 'R (Kanan)')}
          {sideBtn('L', 'L (Kiri)')}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Pemilih jari 1-5 (di kiri, sesuai sketsa video) */}
        <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible">
          {([1, 2, 3, 4, 5] as FingerNo[]).map((f) => (
            <button
              key={f}
              id={`btn-finger-${f}`}
              onClick={() => setFinger(f)}
              title={FINGER_NAMES[f]}
              className={`min-w-[44px] h-11 rounded-lg border-2 font-bold transition ${
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
          <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
            <span className="font-semibold text-gray-700">
              Tangan {side === 'R' ? 'Kanan' : 'Kiri'} • Jari {finger} ({FINGER_NAMES[finger]})
            </span>
            {series.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${delta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Fleksi {delta >= 0 ? '+' : ''}{delta} sejak {first.month}
              </span>
            )}
          </div>

          <div className="h-72">
            {series.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data untuk jari ini.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Line type="monotone" name="Fleksi" dataKey="avgFlexion" stroke="#dc2626" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" name="Ekstensi" dataKey="avgExtension" stroke="#84cc16" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
