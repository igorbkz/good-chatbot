import { X } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Menu</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
          <X size={24} />
        </button>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md">New Chat</a>
          </li>
          <li>
            <a href="#" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md">Settings</a>
          </li>
          <li>
            <a href="#" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md">About</a>
          </li>
        </ul>
      </nav>
    </div>
  )
}

