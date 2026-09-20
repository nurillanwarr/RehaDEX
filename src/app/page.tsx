import Link from 'next/link';
import { patients } from '@/data/dummyData';
import PageHeader from '@/components/layout/PageHeader';
import { LayoutDashboard } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="DASHBOARD UTAMA" 
        subtitle="Sistem Pemantauan Terapi Pasien Stroke" 
        icon={<LayoutDashboard size={24} />} 
      />

      <div className="flex justify-end">
        <button className="bg-[#213e8a] hover:bg-[#1a306c] text-white px-5 py-2.5 rounded-lg shadow-sm transition font-medium flex items-center">
          <span className="mr-2">+</span> Pasien Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Pasien Aktif</p>
          <p className="text-3xl font-bold text-[#1e3a8a]">{patients.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Sesi Hari Ini</p>
          <p className="text-3xl font-bold text-green-600">2</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Status Alat IoT</p>
          <p className="text-xl font-bold text-green-500 flex items-center mt-2">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Online (ESP-01)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Pasien Terakhir</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
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
                    <Link href={`/patient/${patient.id}`} className="text-blue-600 hover:underline whitespace-nowrap">
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
