import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [err, setErr]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login, user }         = useAuth();
  const navigate                = useNavigate();
  const location                = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin')       navigate('/admin',            { replace: true });
    else if (user.role === 'vendor') navigate('/vendor-dashboard', { replace: true });
    else                             navigate(from,               { replace: true });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    if (!form.email || !form.password) return setErr('Email and password are required');
    setLoading(true);
    try {
      const u = await login(form.email.trim(), form.password);
      if (u.role === 'admin')       navigate('/admin',            { replace: true });
      else if (u.role === 'vendor') navigate('/vendor-dashboard', { replace: true });
      else                          navigate(from,               { replace: true });
    } catch (e) {
      setErr(e.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold">24H<span className="text-red-500">x</span>Change</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-sm"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2">
            {loading ? <><Spin /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 font-semibold hover:underline">Create one</Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <strong>Demo credentials:</strong><br />
          Admin: admin@24hxchange.com / Admin@123<br />
          Seller: seller@24hxchange.com / Seller@123<br />
          Buyer: buyer@24hxchange.com / Buyer@123
        </div>
      </div>
    </div>
  );
};

const Spin = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

export default Login;
