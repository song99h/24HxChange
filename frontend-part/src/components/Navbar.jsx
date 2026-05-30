import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { imgUrl } from '../api';

const Navbar = ({ savedItems = [] }) => {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const [imgErr, setImgErr] = useState(false);
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = () => { logout(); setOpen(false); navigate('/'); };

  // Reset imgErr when user avatar changes
  React.useEffect(() => { setImgErr(false); }, [user?.avatar]);

  const avatarSrc = user?.avatar ? imgUrl(user.avatar) : '';
  const showImg   = avatarSrc && !imgErr;

  const AvatarCircle = ({ size = 'sm' }) => {
    const cls = size === 'lg'
      ? 'w-12 h-12 text-xl shrink-0'
      : 'w-8 h-8 text-sm shrink-0';
    return showImg ? (
      <img src={avatarSrc} alt={user?.name || ''}
        className={`${cls} rounded-full object-cover border-2 border-white/30`}
        onError={() => setImgErr(true)} />
    ) : (
      <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold`}>
        {user?.name?.[0]?.toUpperCase() || '?'}
      </div>
    );
  };

  return (
    <>
      {/* ── Top Bar ── */}
      <nav className="px-4 py-3 flex items-center justify-between bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
        {/* Left */}
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setOpen(true)}
            className="bg-amber-400 text-gray-900 font-bold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition">
            ☰
          </button>
          <Link to="/" className="text-xl font-bold tracking-tight whitespace-nowrap">
            24H<span className="text-red-400">x</span>Change
          </Link>
        </div>

        {/* Search — hidden on small screens */}
        <form onSubmit={handleSearch}
          className="hidden md:flex bg-white rounded-lg overflow-hidden flex-1 max-w-md mx-4 shadow">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products, brands..."
            className="px-4 py-2 flex-1 text-gray-900 outline-none text-sm" />
          <button type="submit"
            className="bg-blue-600 px-4 text-white text-sm font-medium hover:bg-blue-700 transition">
            🔍
          </button>
        </form>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <Link to="/saved" className="relative hover:text-amber-400 transition hidden sm:block">
                ❤️
                {savedItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
                    {savedItems.length}
                  </span>
                )}
              </Link>
              <button onClick={() => setOpen(true)} className="flex items-center gap-2">
                <AvatarCircle />
                <span className="text-sm text-gray-300 hidden lg:block max-w-[6rem] truncate">
                  {user.name.split(' ')[0]}
                </span>
              </button>
              {user.role === 'admin' && (
                <Link to="/admin"
                  className="bg-red-600 text-white text-xs px-2.5 py-1 rounded font-medium hover:bg-red-700 transition hidden sm:block">
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── Overlay ── */}
      {open && (
        <div onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col
        ${open ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Sidebar header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
          <span className="text-lg font-bold">
            24H<span className="text-red-400">x</span>Change
          </span>
          <button onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* User card */}
        {user && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex items-center gap-3 shrink-0">
            <AvatarCircle size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <span className={`inline-block text-xs font-medium capitalize px-1.5 py-0.5 rounded mt-0.5 ${
                user.role === 'admin'  ? 'bg-red-100 text-red-700' :
                user.role === 'vendor' ? 'bg-purple-100 text-purple-700' :
                                         'bg-blue-100 text-blue-700'}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-0.5">
          <SL to="/" label="🏠 Home"       close={() => setOpen(false)} />
          <SL to="/saved" label="❤️ Saved Items" close={() => setOpen(false)} />

          <Sep label="Account" />
          {user ? (
            <>
              <SL to="/my-account" label="👤 My Profile"  close={() => setOpen(false)} />
              <SL to="/my-orders"  label="📦 My Orders"   close={() => setOpen(false)} />
              <SL to="/chat"       label="💬 Messages"    close={() => setOpen(false)} />
            </>
          ) : (
            <>
              <SL to="/login"  label="🔑 Login"          close={() => setOpen(false)} />
              <SL to="/signup" label="✨ Create Account"  close={() => setOpen(false)} />
            </>
          )}

          <Sep label="Sell" />
          <SL to="/become-seller" label="🏪 Become a Seller" close={() => setOpen(false)} />
          {user && (user.role === 'vendor' || user.role === 'admin') && (
            <>
              <SL to="/vendor-dashboard" label="📊 Vendor Dashboard" close={() => setOpen(false)} />
              <SL to="/add-product"      label="➕ Add Product"       close={() => setOpen(false)} />
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Sep label="Admin" />
              <SL to="/admin" label="⚙️ Admin Dashboard" close={() => setOpen(false)} />
            </>
          )}
        </nav>

        {/* Logout */}
        {user && (
          <div className="p-4 border-t shrink-0">
            <button onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium transition text-sm">
              🚪 Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

const SL = ({ to, label, close }) => (
  <Link to={to} onClick={close}
    className="flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition text-sm font-medium">
    {label}
  </Link>
);

const Sep = ({ label }) => (
  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 pt-4 pb-1">{label}</p>
);

export default Navbar;
