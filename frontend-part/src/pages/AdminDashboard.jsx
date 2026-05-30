import React, { useEffect, useState, useCallback } from 'react';
import { getAdminStatsApi, getAllUsersApi, getPendingProductsApi, approveProductApi, toggleBlockUserApi, changeUserRoleApi, getAllOrdersApi, imgUrl } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const TABS = ['Overview', 'Users', 'Products', 'Orders'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminDashboard = () => {
  const [tab, setTab]             = useState('Overview');
  const [stats, setStats]         = useState(null);
  const [chartData, setChart]     = useState([]);
  const [users, setUsers]         = useState([]);
  const [pending, setPending]     = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState('');
  const [actionLoading, setAct]   = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      if (tab === 'Overview') {
        const d = await getAdminStatsApi();
        setStats(d.stats);
        setChart(d.monthlyOrders?.length
          ? d.monthlyOrders.map(m => ({
              name: MONTH_NAMES[(m._id||1)-1]||`M${m._id}`,
              orders: m.orders||0,
              revenue: Math.round(m.revenue||0),
            }))
          : []);
      } else if (tab === 'Users') {
        const d = await getAllUsersApi();
        setUsers(d.users || []);
      } else if (tab === 'Products') {
        const d = await getPendingProductsApi();
        setPending(d.products || []);
      } else if (tab === 'Orders') {
        const d = await getAllOrdersApi();
        setOrders(d.orders || []);
      }
    } catch (e) { setErr(e.message || 'Failed to load data'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setAction = (key, val) => setAct(p => ({...p, [key]: val}));

  const handleApprove = async (id, approved) => {
    setAction(id, true);
    try {
      await approveProductApi(id, { approved });
      setPending(p => p.filter(x => x._id !== id));
    } catch (e) { alert(e.message); }
    finally { setAction(id, false); }
  };

  const handleBlock = async (id) => {
    setAction(`block-${id}`, true);
    try {
      const d = await toggleBlockUserApi(id);
      setUsers(p => p.map(u => u._id===id ? {...u, isBlocked: d.user.isBlocked} : u));
    } catch (e) { alert(e.message); }
    finally { setAction(`block-${id}`, false); }
  };

  const handleRole = async (id, role) => {
    setAction(`role-${id}`, true);
    try {
      await changeUserRoleApi(id, { role });
      setUsers(p => p.map(u => u._id===id ? {...u, role} : u));
    } catch (e) { alert(e.message); }
    finally { setAction(`role-${id}`, false); }
  };

  const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center text-center">
      <div className={`${color} text-white w-11 h-11 rounded-full flex items-center justify-center text-xl mb-2`}>{icon}</div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-5">
        <h1 className="text-2xl font-bold">⚙️ Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">24HxChange Management Panel</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6 flex overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${tab===t?'border-blue-600 text-blue-600':'border-transparent text-gray-600 hover:text-blue-500'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex justify-between">
            <span>{err}</span>
            <button onClick={fetchData} className="underline font-medium">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Overview ── */}
            {tab === 'Overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard label="Users"    value={stats?.totalUsers??0}    icon="👤" color="bg-blue-500" />
                  <StatCard label="Vendors"  value={stats?.totalVendors??0}  icon="🏪" color="bg-purple-500" />
                  <StatCard label="Products" value={stats?.totalProducts??0} icon="📦" color="bg-green-500" />
                  <StatCard label="Orders"   value={stats?.totalOrders??0}   icon="🛒" color="bg-orange-500" />
                  <StatCard label="Pending"  value={stats?.pendingProducts??0} icon="⏳" color="bg-yellow-500" />
                  <StatCard label="Revenue"  value={`₹${((stats?.totalRevenue||0)/1000).toFixed(1)}k`} icon="💰" color="bg-emerald-500" />
                </div>

                <div className="bg-white rounded-xl shadow p-5">
                  <h3 className="font-semibold text-gray-700 mb-4">Monthly Orders & Revenue</h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData} margin={{ top:5,right:10,left:0,bottom:5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize:12 }} />
                        <YAxis tick={{ fontSize:12 }} />
                        <Tooltip /><Legend />
                        <Bar dataKey="orders"  fill="#3b82f6" radius={[4,4,0,0]} name="Orders" />
                        <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} name="Revenue (₹)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-10 text-gray-400">No order data yet</div>
                  )}
                </div>

                {stats?.pendingProducts > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-amber-800">{stats.pendingProducts} product(s) awaiting approval</p>
                      <button onClick={() => setTab('Products')} className="text-sm text-amber-600 underline">Review now →</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Users ── */}
            {tab === 'Users' && (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">All Users ({users.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>{['Name','Email','Role','Status','Joined','Actions'].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found</td></tr>}
                      {users.map(u => (
                        <tr key={u._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {/* ✅ User avatar */}
                              {u.avatar ? (
                                <img src={imgUrl(u.avatar)} alt={u.name}
                                  className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0"
                                  onError={e=>{e.target.onerror=null;e.target.style.display='none';}} />
                              ) : (
                                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {u.name?.[0]?.toUpperCase()||'?'}
                                </div>
                              )}
                              <span className="font-medium text-gray-800">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                          <td className="px-4 py-3">
                            <select value={u.role} onChange={e => handleRole(u._id, e.target.value)}
                              disabled={actionLoading[`role-${u._id}`]}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50">
                              <option value="user">User</option>
                              <option value="vendor">Vendor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isBlocked?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>
                              {u.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{u.createdAt?new Date(u.createdAt).toLocaleDateString():'—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleBlock(u._id)} disabled={actionLoading[`block-${u._id}`]}
                              className={`text-xs px-3 py-1 rounded font-medium transition disabled:opacity-50 ${u.isBlocked?'bg-green-100 text-green-700 hover:bg-green-200':'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                              {actionLoading[`block-${u._id}`] ? '...' : u.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Products (Pending Approval) ── */}
            {tab === 'Products' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Pending Approvals ({pending.length})</h3>
                {pending.length === 0 && (
                  <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
                    <p className="text-4xl mb-3">✅</p>
                    <p className="font-medium text-gray-600">All products reviewed!</p>
                  </div>
                )}
                {pending.map(p => (
                  <div key={p._id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4 flex-wrap">
                    {/* ✅ Product image */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {p.images?.[0] ? (
                        <img src={imgUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover"
                          onError={e=>{e.target.onerror=null;e.target.src='https://placehold.co/80x80/f3f4f6/9ca3af?text=No+Img';}} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">{p.title}</h4>
                      <p className="text-sm text-gray-500">
                        By: <span className="font-medium">{p.vendor?.name||'Unknown'}</span>
                        {p.vendor?.email && <span className="text-gray-400"> ({p.vendor.email})</span>}
                      </p>
                      <p className="text-sm text-gray-400">{p.category} • <span className="capitalize">{p.condition}</span> • ₹{Number(p.price).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleApprove(p._id, true)} disabled={actionLoading[p._id]}
                        className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        {actionLoading[p._id] ? '...' : '✅ Approve'}
                      </button>
                      <button onClick={() => handleApprove(p._id, false)} disabled={actionLoading[p._id]}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        {actionLoading[p._id] ? '...' : '❌ Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Orders ── */}
            {tab === 'Orders' && (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">All Orders ({orders.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>{['Order ID','Buyer','Items','Amount','Payment','Status','Date'].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No orders yet</td></tr>}
                      {orders.map(o => (
                        <tr key={o._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">#{o._id?.slice(-8).toUpperCase()}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-xs text-gray-800">{o.buyer?.name||'—'}</p>
                            <p className="text-gray-400 text-xs">{o.buyer?.email||''}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{o.items?.length||0}</td>
                          <td className="px-4 py-3 font-semibold">₹{Number(o.finalAmount||0).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              o.paymentStatus==='paid'   ? 'bg-green-100 text-green-700' :
                              o.paymentStatus==='failed' ? 'bg-red-100 text-red-700' :
                                                           'bg-yellow-100 text-yellow-700'}`}>
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              o.orderStatus==='delivered' ? 'bg-green-100 text-green-700' :
                              o.orderStatus==='shipped'   ? 'bg-blue-100 text-blue-700' :
                              o.orderStatus==='cancelled' ? 'bg-red-100 text-red-700' :
                              o.orderStatus==='confirmed' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-yellow-100 text-yellow-700'}`}>
                              {o.orderStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{o.createdAt?new Date(o.createdAt).toLocaleDateString():'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
