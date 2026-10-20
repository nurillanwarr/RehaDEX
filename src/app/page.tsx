import Link from 'next/link';
import { getPatientsList } from '@/lib/patientData';
import PageHeader from '@/components/layout/PageHeader';
import NewPatientModal from '@/components/interactive/NewPatientModal';
import { LayoutDashboard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { patients, source } = await getPatientsList();
  const nextCode = `STK-${String(patients.length + 1).padStart(3, '0')}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="DASHBOARD UTAMA"
        subtitle="Sistem Pemantauan Terapi Pasien Stroke"
        icon={<LayoutDashboard size={24} />}
      />

      <div className="flex flex-wrap justify-between items-center gap-3">
        <span
          className={`text-xs px-2.5 py-1 rounded-full ${
            source === 'supabase' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          Sumber data: {source === 'supabase' ? 'Supabase' : 'Data demo / Lokal'}
        </span>
        <NewPatientModal nextCode={nextCode} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Pasien Aktif</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#1e3a8a] mt-1">{patients.length}</p>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Sesi Hari Ini</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">2</p>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Status Alat IoT</p>
          <p className="text-lg sm:text-xl font-bold text-green-500 flex items-center mt-2">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Online (ESP-01)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">Daftar Pasien Terakhir</h2>
        </div>

        {/* Tampilan Kartu untuk Layar HP (Mobile) agar tidak terpotong */}
        <div className="divide-y divide-gray-100 sm:hidden">
          {patients.map(patient => (
            <div key={patient.id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-gray-500">{patient.id}</span>
                <p className="font-semibold text-blue-900">{patient.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{patient.diagnosis}</p>
              </div>
              <Link
                href={`/patient/${patient.id}`}
                className="shrink-0 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3.5 py-2 rounded-lg text-xs font-semibold transition"
              >
                Lihat Profil &rarr;
              </Link>
            </div>
          ))}
        </div>

        {/* Tampilan Tabel untuk Layar Tablet & Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="py-3 px-6 font-medium">ID</th>
                <th className="py-3 px-6 font-medium">Nama</th>
                <th className="py-3 px-6 font-medium">Diagnosis</th>
                <th className="py-3 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {patients.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-6">{patient.id}</td>
                  <td className="py-3 px-6 font-medium text-blue-900">{patient.name}</td>
                  <td className="py-3 px-6">{patient.diagnosis}</td>
                  <td className="py-3 px-6 text-right">
                    <Link
                      href={`/patient/${patient.id}`}
                      className="text-blue-600 hover:underline whitespace-nowrap font-medium"
                    >
                      Lihat Profil &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
