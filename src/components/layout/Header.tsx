import { UserCircle, Bell } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
      <div className="font-semibold text-gray-700 text-lg">
        MyAcademic Dashboard
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-blue-900 transition">
          <Bell size={20} />
        </button>
        <div className="flex items-center space-x-2 cursor-pointer">
          <UserCircle size={32} className="text-gray-400" />
          <div className="text-sm">
            <p className="font-semibold text-gray-700">Dr. Fisioterapis</p>
            <p className="text-gray-500 text-xs">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
