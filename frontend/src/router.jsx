import { createBrowserRouter } from 'react-router-dom';
import GuestEntry from './pages/GuestEntry.jsx';
import GuestInvitation from './pages/GuestInvitation.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminDrinks from './pages/AdminDrinks.jsx';
import AdminCodes from './pages/AdminCodes.jsx';
import AdminEvents from './pages/AdminEvents.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';
import NotFound from './pages/NotFound.jsx';

export const routes = [
  { path: '/', element: <GuestEntry /> },
  { path: '/invitation', element: <GuestInvitation /> },
  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/admin', element: <RequireAdmin><AdminDashboard /></RequireAdmin> },
  { path: '/admin/drinks', element: <RequireAdmin><AdminDrinks /></RequireAdmin> },
  { path: '/admin/codes', element: <RequireAdmin><AdminCodes /></RequireAdmin> },
  { path: '/admin/events', element: <RequireAdmin><AdminEvents /></RequireAdmin> },
  { path: '*', element: <NotFound /> },
];

export const router = createBrowserRouter(routes);
