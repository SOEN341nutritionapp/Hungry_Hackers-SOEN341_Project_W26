import { Routes, Route } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import Main from './pages/Main'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Profile from './pages/Profile'

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Protected routes */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Main />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}
