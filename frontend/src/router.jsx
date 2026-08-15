import { createBrowserRouter } from 'react-router-dom';
import GuestEntry from './pages/GuestEntry.jsx';
import GuestInvitation from './pages/GuestInvitation.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminDrinks from './pages/AdminDrinks.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <GuestEntry /> },
  { path: '/invitation', element: <GuestInvitation /> },
  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/admin', element: <RequireAdmin><AdminDashboard /></RequireAdmin> },
  { path: '/admin/drinks', element: <RequireAdmin><AdminDrinks /></RequireAdmin> },
]);
