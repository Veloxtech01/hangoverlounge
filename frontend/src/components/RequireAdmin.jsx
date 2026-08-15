import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/adminAuth.js';

export default function RequireAdmin({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
