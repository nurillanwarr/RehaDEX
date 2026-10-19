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

      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <span className={`text-xs px-2.5 py-1 rounded-full ${source === 'supabase' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          Sumber data: {source === 'supabase' ? 'Supabase' : 'Data demo / Lokal'}
        </span>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/patient/${patient.id}/mode?method=manual`}
            className="bg-white border-2 border-[#12aca7] text-[#12aca7] hover:bg-teal-50 px-4 py-2 rounded-lg shadow-sm transition font-medium text-sm"
          >
            + Input Manual (Semua Jari)
          </Link>
          <Link
            href={`/patient/${patient.id}/diagnosa`}
            className="bg-[#12aca7] hover:bg-[#0e8a86] text-white px-5 py-2 rounded-lg shadow-sm transition font-medium text-sm"
          >
            Mulai Sesi Baru (Manual / Alat IoT)
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Nama</p>
            <p className="font-semibold text-lg">{patient.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Umur / Jenis Kelamin</p>
            <p className="font-semibold">{patient.age} th / {patient.gender}</p>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Diagnosis</p>
            <p className="font-semibold text-blue-900">{patient.diagnosis}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Catatan Medis</p>
            <p className="font-semibold">{patient.notes}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Tren Skor Fungsional</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse mt-4 min-w-[300px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="py-2 px-4 font-medium">Bulan</th>
                  <th className="py-2 px-4 font-medium">Skor</th>
                  <th className="py-2 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {funScores.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-4">{item.date}</td>
                    <td className="py-2 px-4 font-bold text-blue-800">{item.score} / 100</td>
                    <td className="py-2 px-4 text-green-600 text-sm whitespace-nowrap">{item.score > 60 ? 'Mandiri' : 'Bantuan'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grafik 20x Input IoT yang sudah dirangkum per bulan */}
        <div className="col-span-1 md:col-span-1">
          <PerformanceChart data={chartData} />
        </div>
      </div>

      {/* Grafik performa per jari (R/L × Jari 1-5) - sesuai Video 2 */}
      <FingerPerformanceChart
        data={fingers}
        defaultSide={patient.diagnosis.includes('Kiri') ? 'L' : 'R'}
      />
    </div>
  );
}
