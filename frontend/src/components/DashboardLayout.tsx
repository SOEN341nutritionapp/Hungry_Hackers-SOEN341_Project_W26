import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function DashboardLayout() {
  const location = useLocation()
  const { logout } = useAuth()

  const navItems = [
    { name: 'Main', path: '/' },
    { name: 'Profile', path: '/profile' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex min-h-screen bg-white">
      {/* Simple Sidebar */}
      <aside className="w-64 bg-gray-100 border-r border-gray-300">
        {/* Logo */}
        <div className="p-6 border-b border-gray-300">
          <h1 className="text-2xl font-bold text-gray-900">MealMajor</h1>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.path)

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`block px-4 py-2 rounded ${
                      active
                        ? 'bg-gray-300 text-gray-900 font-semibold'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <button 
            onClick={logout}
            className="w-full border border-gray-400 px-4 py-2 rounded hover:bg-gray-200 text-gray-900"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        <Outlet />
      </main>
    </div>
  )
}