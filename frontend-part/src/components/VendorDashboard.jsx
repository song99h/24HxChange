import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  getVendorStatsApi, getMyProductsApi, getVendorOrdersApi,
  deleteProductApi, updateOrderStatusApi, getSellerOffersApi, imgUrl,
} from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SellerOffers from './SellerOffers';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const VendorDashboard = () => {
  const location = useLocation();
  const [tab, setTab]              = useState('Overview');
  const [stats, setStats]          = useState(null);
  const [chartData, setChart]      = useState([]);
  const [products, setProducts]    = useState([]);
  const [orders, setOrders]        = useState([]);
  const [pendingOffers, setPendingOffers] = useState(0);
  const [loading, setLoading]      = useState(true);
  const [err, setErr]              = useState('');
  const [deleting, setDeleting]    = useState({});

  // Auto-switch to My Products if redirected after adding a product
  useEffect(() => {
    if (location.state?.newProduct) setTab('My Products');
  }, []);

  // Fetch pending offer count for badge
  useEffect(() => {
    getSellerOffersApi()
      .then(d => setPendingOffers((d.offers || []).filter(o => o.status === 'pending').length))
      .catch(() => {});
  }, []);

  const fetchTab = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      if (tab === 'Overview') {
        const d = await getVendorStatsApi();
        setStats(d.stats);
        setChart(d.monthlySales?.length
          ? d.monthlySales.map(m => ({
              name: MONTH_NAMES[(m._id || 1) - 1] || `M${m._id}`,
              orders: m.orders || 0,
            }))
          : []);
      } else if (tab === 'My Products') {
        const d = await getMyProductsApi();
        setProducts(d.products || []);
      } else if (tab === 'Orders') {
        const d = await getVendorOrdersApi();
        setOrders(d.orders || []);
      }
      // 'Offers' tab is self-managed by SellerOffers component
    } catch (e) {
      setErr(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== 'Offers') fetchTab();
    else setLoading(false);
  }, [fetchTab, tab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(p => ({ ...p, [id]: true }));
    try {
      await deleteProductApi(id);
      setProducts(p => p.filter(x => x._id !== id));
    } catch (e) {
      alert(e.message || 'Failed to delete');
    } finally {
      setDeleting(p => ({ ...p, [id]: false }));
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatusApi(orderId, { status });
      setOrders(p => p.map(o => o._id === orderId ? { ...o, orderStatus: status } : o));
    } catch (e) { alert(e.message); }
  };

  const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center text-center">
      <div className={`${color} text-white w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2`}>
        {icon}
      </div>
      <p className="text-lg font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );

  const TABS = ['Overview', 'My Products', 'Orders', 'Offers'];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-purple-700 text-white px-6 py-5">
        <h1 className="text-2xl text-amber-200 font-bold">📊 Vendor Dashboard</h1>
        <p className="text-green-200 text-sm mt-0.5">Manage your store and listings</p>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b px-4 flex items-center justify-between overflow-x-auto">
        <div className="flex shrink-0">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-500'
              }`}
            >
              {t}
              {/* Badge for pending offers */}
              {t === 'Offers' && pendingOffers > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs w-4 h-4 rounded-full inline-flex items-center justify-center font-bold">
                  {pendingOffers}
                </span>
              )}
            </button>
          ))}
        </div>
        <Link
          to="/add-product"
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition mx-2 my-1.5"
        >
          + Add Product
        </Link>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex justify-between">
            <span>{err}</span>
            <button onClick={fetchTab} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Offers tab — self-managed */}
        {tab === 'Offers' && <SellerOffers />}

        {tab !== 'Offers' && (loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'Overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard label="Products" value={stats?.totalProducts ?? 0}   icon="📦" color="bg-blue-500" />
                  <StatCard label="Views"    value={stats?.totalViews ?? 0}      icon="👁️" color="bg-purple-500" />
                  <StatCard label="Sold"     value={stats?.totalSold ?? 0}       icon="✅" color="bg-green-500" />
                  <StatCard label="Orders"   value={stats?.totalOrders ?? 0}     icon="🛒" color="bg-orange-500" />
                  <StatCard label="Pending"  value={stats?.pendingApproval ?? 0} icon="⏳" color="bg-yellow-500" />
                  <StatCard
                    label="Revenue"
                    value={`₹${((stats?.totalRevenue || 0) / 1000).toFixed(1)}k`}
                    icon="💰"
                    color="bg-emerald-500"
                  />
                </div>

                <div className="bg-white rounded-xl shadow p-5">
                  <h3 className="font-semibold text-gray-700 mb-4">Monthly Sales</h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="orders" fill="#3b82f6" radius={[4,4,0,0]} name="Orders" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-3xl mb-2">📈</p>
                      <p className="text-sm">No sales data yet. List your first product!</p>
                    </div>
                  )}
                </div>

                {pendingOffers > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">📩</span>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-800">
                        {pendingOffers} pending offer{pendingOffers !== 1 ? 's' : ''} waiting for your response
                      </p>
                      <p className="text-sm text-amber-600">Respond quickly — buyers are waiting!</p>
                    </div>
                    <button
                      onClick={() => setTab('Offers')}
                      className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Review →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── MY PRODUCTS ── */}
            {tab === 'My Products' && (
              <div className="space-y-3">
                {products.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
                    <p className="text-5xl mb-3">📦</p>
                    <p className="font-semibold text-lg text-gray-600">No products yet</p>
                    <Link
                      to="/add-product"
                      className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
                    >
                      + Add Your First Product
                    </Link>
                  </div>
                ) : products.map(p => (
                  <div key={p._id} className="bg-white rounded-xl shadow p-4 flex gap-4 items-center flex-wrap">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                      {p.images?.[0] ? (
                        <img
                          src={imgUrl(p.images[0])} alt={p.title}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80?text=?'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">{p.title}</h4>
                      <p className="text-sm text-gray-500">
                        ₹{Number(p.price).toLocaleString('en-IN')} • {p.category} •{' '}
                        <span className="capitalize">{p.condition}</span>
                      </p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.isApproved ? '✅ Live' : '⏳ Pending'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">👁 {p.views || 0}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">📦 {p.stock} stock</span>
                        {p.sold > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">✅ {p.sold} sold</span>}
                        {p.isNegotiable && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">💬 Negotiable</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Link to={`/product/${p._id}`}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition">
                        👁 View
                      </Link>
                      <Link to={`/edit-product/${p._id}`}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition">
                        ✏️ Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p._id)}
                        disabled={deleting[p._id]}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                      >
                        {deleting[p._id] ? '...' : '🗑 Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === 'Orders' && (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Incoming Orders ({orders.length})</h3>
                </div>
                {orders.length === 0 ? (
                  <div className="text-center py-14 text-gray-400">
                    <p className="text-4xl mb-3">🛒</p>
                    <p className="font-medium text-gray-600">No orders yet</p>
                    <p className="text-sm mt-1">Orders appear here once buyers purchase your products</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                          {['Order','Buyer','Items','Amount','Status','Update','Date'].map(h => (
                            <th key={h} className="text-left px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map(o => (
                          <tr key={o._id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">
                              #{o._id?.slice(-6).toUpperCase()}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-xs text-gray-800">{o.buyer?.name || '—'}</p>
                              <p className="text-gray-400 text-xs">{o.buyer?.phone || o.buyer?.email || ''}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{o.items?.length || 0}</td>
                            <td className="px-4 py-3 font-semibold">
                              ₹{Number(o.finalAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                o.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                                o.orderStatus === 'shipped'   ? 'bg-blue-100 text-blue-700' :
                                o.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {o.orderStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={o.orderStatus}
                                onChange={e => handleStatusChange(o._id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                              >
                                {['placed','confirmed','shipped','delivered','cancelled'].map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        ))}
      </div>
    </div>
  );
};

export default VendorDashboard;
