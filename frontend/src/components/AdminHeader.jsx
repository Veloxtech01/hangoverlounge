import { NavLink, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/adminAuth.js';

const navLinkClasses = ({ isActive }) =>
  `text-[11px] font-medium uppercase tracking-[0.2em] transition-colors duration-200 ${
    isActive ? 'text-[#F0E3CC]' : 'text-[#9C8F80] hover:text-[#F0E3CC]'
  }`;

export default function AdminHeader({ subtitle }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate('/admin/login');
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-semibold tracking-[0.2em] text-[#F0E3CC]">
          HANGOVER LOUNGE
        </p>
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#9C8F80]">
          {subtitle}
        </p>
      </div>
      <nav className="flex items-center gap-5">
        <NavLink to="/admin" end className={navLinkClasses}>
          Dashboard
        </NavLink>
        <NavLink to="/admin/events" className={navLinkClasses}>
          Events
        </NavLink>
        <NavLink to="/admin/drinks" className={navLinkClasses}>
          Drinks
        </NavLink>
        <NavLink to="/admin/codes" className={navLinkClasses}>
          Codes
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.2em] text-[#9C8F80] transition-colors duration-200 hover:text-[#F0E3CC]"
        >
          Log out
        </button>
      </nav>
    </div>
  );
}
