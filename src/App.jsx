import { Route, Routes } from 'react-router-dom'
import CreateGroup from './pages/CreateGroup'
import Dashboard from './pages/Dashboard'
import GroupDetail from './pages/GroupDetail'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/group/new" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
      <Route path="/group/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
    </Routes>
  )
}
