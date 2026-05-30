import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [form, setForm]     = useState({ name:'', email:'', password:'', phone:'', role:'user' });
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user }  = useAuth();
  const navigate            = useNavigate();

  useEffect(() => {
    if (!user) return;
    navigate(user.role === 'vendor' ? '/vendor-dashboard' : '/', { replace: true });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    if (!form.name.trim())  return setErr('Name is required');
    if (!form.email.trim()) return setErr('Email is required');
    if (form.password.length < 6) return setErr('Password must be at least 6 characters');
    setLoading(true);
    try {
      const u = await register(form.name.trim(), form.email.trim(), form.password, form.phone, form.role);
      navigate(u.role === 'vendor' ? '/vendor-dashboard' : '/', { replace: true });
    } catch (e) { setErr(e.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold">Join 24H<span className="text-red-500">x</span>Change</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your free account today</p>
        </div>

        {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{err}</div>}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {[
            { label:'Full Name *', key:'name', type:'text',  ph:'John Doe',        ac:'name' },
            { label:'Email *',     key:'email', type:'email', ph:'you@example.com', ac:'email' },
            { label:'Password * (min 6 chars)', key:'password', type:'password', ph:'••••••••', ac:'new-password' },
            { label:'Phone (optional)', key:'phone', type:'tel', ph:'+91 9876543210', ac:'tel' },
          ].map(({ label, key, type, ph, ac }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} value={form[key]} placeholder={ph} autoComplete={ac}
                onChange={e => setForm({...form, [key]: e.target.value})}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ v:'user', l:'🛍️ Buy', d:'Browse & purchase' },{ v:'vendor', l:'🏪 Sell', d:'List & sell items' }].map(opt => (
                <button key={opt.v} type="button" onClick={() => setForm({...form, role: opt.v})}
                  className={`border-2 rounded-lg p-3 text-left transition ${form.role === opt.v ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="text-sm font-semibold">{opt.l}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.d}</p>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
