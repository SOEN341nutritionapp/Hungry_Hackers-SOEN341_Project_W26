
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import {
  LayoutDashboard,
  //Heart,
  BookOpen,
  ShoppingCart,
  CalendarDays,
  User,
  LogOut,
  Menu,
} from 'lucide-react'

export default function DashboardLayout() {
  const { logout } = useAuth()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Profile', path: '/profile', icon: User },
    // { name: 'My Meals', path: '/meals', icon: Heart },
    { name: 'Recipes', path: '/recipes', icon: BookOpen },
    { name: 'Shopping List', path: '/shopping', icon: ShoppingCart },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
  ]

  return (
    <div className="min-h-screen app-bg bg-base-100">
      {/* DaisyUI drawer (sidebar layout) */}
      <div className="drawer lg:drawer-open">
        <input id="app-drawer" type="checkbox" className="drawer-toggle" />

        {/* Page content */}
        <div className="drawer-content flex flex-col">
          {/* Top bar (mobile) */}
          <div className="navbar bg-base-100 border-b border-base-300 lg:hidden">
            <div className="flex-none">
              <label htmlFor="app-drawer" className="btn btn-ghost btn-square">
                <Menu className="h-5 w-5" />
              </label>
            </div>
            <div className="flex-1">
              <span className="font-extrabold text-lg text-primary">Meal Major</span>
            </div>
          </div>

          <main className="p-4 md:p-8">
            <Outlet />
          </main>
        </div>

        {/* Sidebar */}
        <div className="drawer-side">
          <label htmlFor="app-drawer" className="drawer-overlay"></label>

          <aside className="min-h-full w-80 bg-base-100 border-r border-base-300">
            <div className="mm-sidebar">
              {/* Brand (matches screenshot style) */}
              <div>
                <div className="mm-brand">Meal Major</div>
                <div className="mm-subtitle">Plan your perfect week</div>
                <div className="mm-divider" />
              </div>

              {/* Nav */}
              <nav className="flex-1">
                <ul className="mm-menu">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          end
                          className={({ isActive }) =>
                            isActive ? 'mm-active' : undefined
                          }
                        >
                          <Icon />
                          <span>{item.name}</span>
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Logout (simple + matches clean style) */}
              <div className="mt-8 pt-4 border-t border-base-300">
                <button
                  onClick={logout}
                  className="btn w-full justify-start rounded-2xl bg-base-100 border-base-300 hover:bg-base-200"
                  type="button"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-semibold">Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
