import Link from 'next/link';
import PerformanceChart from '@/components/charts/PerformanceChart';
import FingerPerformanceChart from '@/components/charts/FingerPerformanceChart';
import { getPatientBundle } from '@/lib/patientData';
import PageHeader from '@/components/layout/PageHeader';
import { FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PatientProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { patient, monthly: chartData, scores: funScores, fingers, source } = await getPatientBundle(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="RINCIAN DATA PASIEN"
        subtitle={`${patient.id} • ${patient.name}`}
        icon={<FileText size={24} />}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <span
          className={`self-start text-xs px-2.5 py-1 rounded-full ${
            source === 'supabase' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          Sumber data: {source === 'supabase' ? 'Supabase' : 'Data demo / Lokal'}
        </span>
        <div className="grid grid-cols-1 sm:flex gap-2 w-full sm:w-auto">
          <Link
            href={`/patient/${patient.id}/mode?method=manual`}
            className="text-center bg-white border-2 border-[#12aca7] text-[#12aca7] hover:bg-teal-50 px-4 py-2 rounded-lg shadow-sm transition font-medium text-sm"
          >
            + Input Manual (Semua Jari)
          </Link>
          <Link
            href={`/patient/${patient.id}/diagnosa`}
            className="text-center bg-[#12aca7] hover:bg-[#0e8a86] text-white px-5 py-2 rounded-lg shadow-sm transition font-medium text-sm"
          >
            Mulai Sesi Baru (Manual / Alat IoT)
          </Link>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
        <div className="space-y-3">
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Nama</p>
            <p className="font-semibold text-base sm:text-lg">{patient.name}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Umur / Jenis Kelamin</p>
            <p className="font-semibold text-sm sm:text-base">
              {patient.age} th / {patient.gender}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Diagnosis</p>
            <p className="font-semibold text-blue-900 text-sm sm:text-base">{patient.diagnosis}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Catatan Medis</p>
            <p className="font-semibold text-sm sm:text-base">{patient.notes}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Tren Skor Fungsional</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse mt-2">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs sm:text-sm">
                  <th className="py-2.5 px-3 sm:px-4 font-medium">Bulan</th>
                  <th className="py-2.5 px-3 sm:px-4 font-medium">Skor</th>
                  <th className="py-2.5 px-3 sm:px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {funScores.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 sm:px-4">{item.date}</td>
                    <td className="py-2.5 px-3 sm:px-4 font-bold text-blue-800">{item.score} / 100</td>
                    <td className="py-2.5 px-3 sm:px-4 text-green-600 text-xs sm:text-sm whitespace-nowrap">
                      {item.score > 60 ? 'Mandiri' : 'Bantuan'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1">
          <PerformanceChart data={chartData} />
        </div>
      </div>

      {/* Grafik performa per jari (Gerakan 1 & 2 × R/L × Fleksi/Ekstensi × Jari 1-5) */}
      <FingerPerformanceChart
        data={fingers}
        defaultSide={patient.diagnosis.includes('Kiri') ? 'L' : 'R'}
      />
    </div>
  );
}
