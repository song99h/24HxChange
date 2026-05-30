import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrdersApi, getBuyerOffersApi, deleteOfferApi, imgUrl } from '../api';
import OrderFromOfferModal from '../components/OrderFromOfferModal';
import BuyerOffers from '../components/BuyerOffers';

const STATUS_STYLE = {
  placed:    'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
const PAY_STYLE = {
  pending:  'bg-orange-100 text-orange-700',
  paid:     'bg-green-100 text-green-700',
  failed:   'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};
const OFFER_STYLE = {
  pending:   'bg-yellow-100 text-yellow-700',
  accepted:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  countered: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
};

const TABS = ['My Orders', 'My Offers'];

const MyOrders = () => {
  const [tab, setTab]                 = useState('My Orders');
  const [orders, setOrders]           = useState([]);
  const [offers, setOffers]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [err, setErr]                 = useState('');
  const [orderOfferModal, setModal]   = useState(null); // offer to order
  const [orderSuccess, setOrderOk]    = useState(null); // placed order
  const navigate = useNavigate();

  const load = () => {
    setLoading(true); setErr('');
    Promise.allSettled([
      getMyOrdersApi().then(d   => setOrders(d.orders  || [])),
      getBuyerOffersApi().then(d => setOffers(d.offers || [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this offer?')) return;
    try {
      await deleteOfferApi(id);
      setOffers(p => p.filter(o => o._id !== id));
    } catch (e) { alert(e.message); }
  };

  const handleOrderSuccess = (order) => {
    setModal(null);
    setOrderOk(order);
    // Refresh offers so the completed one shows updated status
    getBuyerOffersApi().then(d => setOffers(d.offers || []));
    // Switch to My Orders tab
    setTab('My Orders');
    getMyOrdersApi().then(d => setOrders(d.orders || []));
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Order-from-offer modal */}
      {orderOfferModal && (
        <OrderFromOfferModal
          offer={orderOfferModal}
          onClose={() => setModal(null)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {/* Order success banner */}
      {orderSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl mb-5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold">Order placed from your offer!</p>
              <p className="text-sm text-green-600">
                Order #{orderSuccess._id?.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button onClick={() => setOrderOk(null)} className="text-green-600 hover:text-green-800 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-5">📦 Orders & Offers</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {TABS.map(t => {
          const badge = t === 'My Offers'
            ? offers.filter(o => o.status === 'accepted').length
            : 0;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`relative px-5 py-2.5 text-sm font-medium border-b-2 transition ${tab===t?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-blue-500'}`}>
              {t}
              {badge > 0 && (
                <span className="ml-1.5 bg-green-500 text-white text-xs w-4 h-4 rounded-full inline-flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{err}</div>
      )}

      {/* ── MY ORDERS TAB ── */}
      {tab === 'My Orders' && (
        orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-xl font-semibold text-gray-600">No orders yet</p>
            <p className="text-sm mt-2 mb-6">Start shopping to see your orders here</p>
            <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-2xl shadow overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-mono text-xs text-gray-500 font-medium">
                      Order #{order._id?.slice(-10).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-IN', { year:'numeric',month:'long',day:'numeric' })
                        : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[order.orderStatus]||'bg-gray-100 text-gray-700'}`}>
                      {order.orderStatus}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${PAY_STYLE[order.paymentStatus]||'bg-gray-100 text-gray-700'}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="px-5 py-4 space-y-3">
                  {order.items?.map((item, i) => {
                    const itemImg = item.image || item.product?.images?.[0] || '';
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          {itemImg ? (
                            <img src={imgUrl(itemImg)} alt={item.title || 'Product'}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.onerror=null; e.target.src='https://placehold.co/64x64?text=?'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-800 truncate">{item.title || 'Product'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <p className="font-bold text-sm text-gray-800 shrink-0">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm text-gray-600">
                    <span className="capitalize">{order.paymentMethod}</span>
                    {order.shippingFee > 0 && (
                      <span className="ml-3 text-gray-400">+ ₹{order.shippingFee} shipping</span>
                    )}
                  </div>
                  <div className="font-bold text-gray-800 text-sm">
                    Total: ₹{Number(order.finalAmount||0).toLocaleString('en-IN')}
                  </div>
                </div>
                {order.shippingAddress?.city && (
                  <div className="px-5 py-2 border-t text-xs text-gray-400">
                    📍 {order.shippingAddress.name}, {order.shippingAddress.city}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── MY OFFERS TAB ── */}
      {tab === 'My Offers' && (
        <BuyerOffers />
      )}
      )}
    </div>
  );
};

export default MyOrders;
