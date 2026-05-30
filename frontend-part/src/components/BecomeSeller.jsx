import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applyVendorApi } from '../api';

const BENEFITS = [
  { icon: '📦', title: 'List Unlimited Products',  desc: 'Upload up to 5 images per product' },
  { icon: '💬', title: 'Chat with Buyers Directly', desc: 'Negotiate and close deals faster' },
  { icon: '📊', title: 'Vendor Analytics',           desc: 'Track views, sales and revenue' },
  { icon: '🌍', title: 'Pan-India Reach',             desc: 'Sell to buyers across the country' },
];

const BecomeSeller = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [err, setErr]         = useState('');

  if (user?.role === 'vendor' || user?.role === 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">🏪</p>
        <h2 className="text-2xl font-bold text-gray-800">You're already a seller!</h2>
        <p className="text-gray-500 mt-2">Manage your listings from the Vendor Dashboard.</p>
        <button onClick={() => navigate('/vendor-dashboard')}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition">
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleApply = async () => {
    setLoading(true); setMsg(''); setErr('');
    try {
      const d = await applyVendorApi();
      updateUser(d.user);
      setMsg('🎉 Congratulations! You are now a vendor. Redirecting...');
      setTimeout(() => navigate('/vendor-dashboard'), 2000);
    } catch (e) {
      setErr(e.message || 'Failed to apply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <p className="text-5xl mb-4">🏪</p>
        <h1 className="text-3xl font-bold text-gray-800">Start Selling on 24HxChange</h1>
        <p className="text-gray-500 mt-2">Join thousands of vendors and reach millions of buyers</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {BENEFITS.map(b => (
          <div key={b.title} className="bg-white rounded-xl shadow p-5">
            <p className="text-3xl mb-2">{b.icon}</p>
            <h3 className="font-semibold text-gray-800 text-sm">{b.title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {err}
        </div>
      )}

      {msg ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl text-center font-medium">
          {msg}
        </div>
      ) : (
        <button onClick={handleApply} disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 text-white py-4 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2">
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
          ) : 'Become a Vendor — Free!'}
        </button>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">
        No setup fee. Instant approval. Products go live right away.
      </p>
    </div>
  );
};

export default BecomeSeller;
