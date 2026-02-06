import { Routes, Route } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import Main from './pages/Main'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import DashboardLayout from './components/DashboardLayout'
import Profile from './pages/Profile'
import ProfileEdit from './pages/ProfileEdit'

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />


      {/* Protected routes with dashboard layout */}
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Main />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
        </Route>
      </Route>
    </Routes>
  )
}