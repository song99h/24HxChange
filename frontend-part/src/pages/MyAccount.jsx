import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfileApi, updatePassApi, updateProfileImageApi, imgUrl } from '../api';
import { Link } from 'react-router-dom';

const TABS = ['Profile', 'Security'];

const MyAccount = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('Profile');
  const [form, setForm] = useState({
    name:    user?.name             || '',
    phone:   user?.phone            || '',
    city:    user?.address?.city    || '',
    country: user?.address?.country || '',
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg]   = useState('');
  const [err, setErr]   = useState('');
  const [saving, setSaving] = useState(false);
  const [blobPreview, setBlobPreview] = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [avatarErr, setAvatarErr]     = useState(false);
  const fileRef = useRef(null);

  if (!user) return null;

  const switchTab = (t) => { setTab(t); setMsg(''); setErr(''); };

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blob = URL.createObjectURL(file);
    setBlobPreview(blob);
    setAvatarErr(false);
    setUploading(true); setMsg(''); setErr('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const d = await updateProfileImageApi(fd);
      updateUser(d.user);
      setMsg('Profile image updated! ✅');
      setAvatarErr(false);
    } catch (e) {
      setErr(e.message || 'Upload failed');
    } finally {
      URL.revokeObjectURL(blob);
      setBlobPreview(null);
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── Profile save ───────────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr('Name is required');
    setSaving(true); setMsg(''); setErr('');
    try {
      const fd = new FormData();
      fd.append('name',    form.name.trim());
      fd.append('phone',   form.phone);
      fd.append('address', JSON.stringify({ city: form.city, country: form.country }));
      const d = await updateProfileApi(fd);
      updateUser(d.user);
      setMsg('Profile updated successfully! ✅');
    } catch (e) { setErr(e.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  // ── Password save ──────────────────────────────────────────────────────────
  const handlePassSave = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword)        return setErr('Current password required');
    if (passForm.newPassword.length < 6)  return setErr('New password min 6 characters');
    if (passForm.newPassword !== passForm.confirm) return setErr("Passwords don't match");
    setSaving(true); setMsg(''); setErr('');
    try {
      await updatePassApi({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setMsg('Password updated! ✅');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) { setErr(e.message || 'Failed to update password'); }
    finally { setSaving(false); }
  };

  const roleStyle = {
    admin:  'bg-red-100 text-red-700',
    vendor: 'bg-purple-100 text-purple-700',
    user:   'bg-blue-100 text-blue-700',
  };

  // What image to show: blob preview → saved avatar → initial
  const displaySrc = blobPreview || (user.avatar && !avatarErr ? imgUrl(user.avatar) : '');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ── Profile Card ── */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 shadow-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {displaySrc ? (
                <img src={displaySrc} alt={user.name}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarErr(true)} />
              ) : (
                <span className="text-white text-3xl font-bold select-none">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {/* Camera button */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Change profile photo"
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition disabled:opacity-50 z-10"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange} className="hidden" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-800 truncate">{user.name}</h1>
            <p className="text-gray-500 text-sm truncate">{user.email}</p>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleStyle[user.role] || roleStyle.user}`}>
                {user.role}
              </span>
              {user.role === 'user' && (
                <Link to="/become-seller"
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition font-medium">
                  Become a Seller →
                </Link>
              )}
            </div>
          </div>

          {user.role === 'vendor' && (
            <Link to="/vendor-dashboard"
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition">
              Dashboard
            </Link>
          )}
          {user.role === 'admin' && (
            <Link to="/admin"
              className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition">
              Admin
            </Link>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">📸 Click the camera icon to update your profile photo</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => switchTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Status messages */}
      {msg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{msg}</div>}
      {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{err}</div>}

      {/* Profile Tab */}
      {tab === 'Profile' && (
        <form onSubmit={handleProfileSave} className="bg-white rounded-2xl shadow p-6 space-y-4">
          <F label="Full Name *"              value={form.name}    onChange={v => setForm({...form, name: v})}    />
          <F label="Email (cannot be changed)" value={user.email}  disabled type="email" />
          <F label="Phone"                    value={form.phone}   onChange={v => setForm({...form, phone: v})}   type="tel" placeholder="+91 9876543210" />
          <div className="grid grid-cols-2 gap-4">
            <F label="City"    value={form.city}    onChange={v => setForm({...form, city: v})}    placeholder="Mumbai" />
            <F label="Country" value={form.country} onChange={v => setForm({...form, country: v})} placeholder="India" />
          </div>
          <Btn loading={saving} label="Save Changes" loadingLabel="Saving..." />
        </form>
      )}

      {/* Security Tab */}
      {tab === 'Security' && (
        <form onSubmit={handlePassSave} className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-700">Change Password</h3>
          <F label="Current Password"          value={passForm.currentPassword} onChange={v => setPassForm({...passForm, currentPassword: v})} type="password" placeholder="••••••••" />
          <F label="New Password (min 6 chars)" value={passForm.newPassword}    onChange={v => setPassForm({...passForm, newPassword: v})}    type="password" placeholder="••••••••" />
          <F label="Confirm New Password"       value={passForm.confirm}        onChange={v => setPassForm({...passForm, confirm: v})}         type="password" placeholder="••••••••" />
          <Btn loading={saving} label="Update Password" loadingLabel="Updating..." />
        </form>
      )}
    </div>
  );
};

const F = ({ label, value, onChange, type = 'text', placeholder, disabled }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} value={value} placeholder={placeholder} disabled={disabled}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
      className={`w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${disabled ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`} />
  </div>
);

const Btn = ({ loading, label, loadingLabel }) => (
  <button type="submit" disabled={loading}
    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2">
    {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{loadingLabel}</> : label}
  </button>
);

export default MyAccount;
