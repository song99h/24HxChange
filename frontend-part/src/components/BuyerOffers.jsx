import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getBuyerOffersApi, deleteOfferApi, createOrderFromOfferApi, imgUrl,
} from '../api';
import OrderFromOfferModal from './OrderFromOfferModal';

const STATUS_STYLE = {
  pending:   'bg-amber-50  text-amber-700  border-amber-200',
  accepted:  'bg-green-50  text-green-700  border-green-200',
  rejected:  'bg-red-50    text-red-600    border-red-200',
  countered: 'bg-blue-50   text-blue-700   border-blue-200',
  completed: 'bg-gray-100  text-gray-500   border-gray-200',
};

const STATUS_ICON = {
  pending:   '⏳',
  accepted:  '✅',
  rejected:  '❌',
  countered: '💬',
  completed: '🏁',
};

const SmallSpin = () => (
  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

const BuyerOffers = () => {
  const [offers, setOffers]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [err, setErr]               = useState('');
  const [filter, setFilter]         = useState('all');
  const [withdrawing, setWithdrawing] = useState({});
  const [orderModal, setOrderModal] = useState(null); // offer to place order from
  const [toast, setToast]           = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    getBuyerOffersApi()
      .then(d  => setOffers(d.offers || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Withdraw a pending offer
  const handleWithdraw = async (offerId) => {
    if (!window.confirm('Withdraw this offer?')) return;
    setWithdrawing(p => ({ ...p, [offerId]: true }));
    try {
      await deleteOfferApi(offerId);
      setOffers(p => p.filter(o => o._id !== offerId));
      showToast('Offer withdrawn successfully');
    } catch (e) {
      setErr(e.message || 'Failed to withdraw offer');
    } finally {
      setWithdrawing(p => ({ ...p, [offerId]: false }));
    }
  };

  // After order placed from offer
  const handleOrderSuccess = (order) => {
    setOffers(p => p.map(o => o._id === orderModal._id ? { ...o, status: 'completed' } : o));
    setOrderModal(null);
    showToast('Order placed successfully! 🎉');
  };

  const FILTERS = ['all', 'pending', 'accepted', 'countered', 'rejected', 'completed'];
  const filtered = filter === 'all' ? offers : offers.filter(o => o.status === filter);
  const pendingCount   = offers.filter(o => o.status === 'pending').length;
  const acceptedCount  = offers.filter(o => o.status === 'accepted').length;
  const counteredCount = offers.filter(o => o.status === 'countered').length;
  const actionNeeded   = acceptedCount + counteredCount;

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (err) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{err}</div>
  );

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[999] bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium animate-bounce">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
        </div>
      )}

      {/* Order Modal */}
      {orderModal && (
        <OrderFromOfferModal
          offer={orderModal}
          onClose={() => setOrderModal(null)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📩 My Offers
            {actionNeeded > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                {actionNeeded} need action
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">Track offers you've sent to sellers</p>
        </div>
        <span className="text-sm text-gray-400">{filtered.length} offer{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Stats row */}
      {offers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pending',  val: pendingCount,   color: 'amber',  icon: '⏳' },
            { label: 'Accepted', val: acceptedCount,  color: 'green',  icon: '✅' },
            { label: 'Countered',val: counteredCount, color: 'blue',   icon: '💬' },
            { label: 'Done',     val: offers.filter(o => o.status === 'completed').length, color: 'gray', icon: '🏁' },
          ].map(s => (
            <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-xl p-3 text-center`}>
              <p className="text-2xl">{s.icon}</p>
              <p className={`text-xl font-bold text-${s.color}-700`}>{s.val}</p>
              <p className={`text-xs text-${s.color}-500 font-medium`}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
              filter === f
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? `All (${offers.length})` : `${f} (${offers.filter(o => o.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📩</p>
          <p className="font-medium text-gray-600">
            {filter === 'all' ? 'No offers sent yet' : `No ${filter} offers`}
          </p>
          <p className="text-sm mt-1">
            {filter === 'all'
              ? 'Browse products and make an offer to negotiate a price'
              : 'Switch to "all" to see all offers'}
          </p>
          {filter === 'all' && (
            <Link to="/" className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition">
              Browse Products →
            </Link>
          )}
        </div>
      )}

      {/* Offer cards */}
      {filtered.map(offer => {
        const snap    = offer.productSnapshot;
        const img     = snap?.image || offer.product?.images?.[0] || '';
        const isPending   = offer.status === 'pending';
        const isAccepted  = offer.status === 'accepted';
        const isCountered = offer.status === 'countered';

        return (
          <div
            key={offer._id}
            className={`bg-white rounded-xl shadow overflow-hidden border-l-4 ${
              isAccepted  ? 'border-l-green-400' :
              isCountered ? 'border-l-blue-400'  :
              isPending   ? 'border-l-amber-400'  :
              offer.status === 'rejected' ? 'border-l-red-300' :
              'border-l-gray-200'
            }`}
          >
            {/* Main info */}
            <div className="p-4 flex gap-4 items-start flex-wrap">
              {/* Product image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                {img ? (
                  <img
                    src={imgUrl(img)}
                    alt={snap?.title || 'Product'}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/64x64?text=?'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link
                  to={offer.product?._id ? `/product/${offer.product._id}` : '#'}
                  className="font-semibold text-gray-800 hover:text-amber-600 transition truncate block text-sm"
                >
                  {snap?.title || offer.product?.title || 'Product'}
                </Link>

                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">
                    Listed: ₹{Number(snap?.price || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-amber-600 font-bold text-sm">
                    Your offer: ₹{Number(offer.offerPrice).toLocaleString('en-IN')}
                  </span>
                  {snap?.price > 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      ({Math.round(((snap.price - offer.offerPrice) / snap.price) * 100)}% below)
                    </span>
                  )}
                </div>

                {/* Seller info */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {(offer.seller?.name || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-500">Seller: {offer.seller?.name || '—'}</span>
                </div>

                {/* Your message */}
                {offer.message && (
                  <p className="text-xs text-gray-400 italic mt-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    Your note: "{offer.message}"
                  </p>
                )}
              </div>

              {/* Status badge + date */}
              <div className="shrink-0 text-right">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize border ${STATUS_STYLE[offer.status] || ''}`}>
                  {STATUS_ICON[offer.status]} {offer.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('en-IN') : ''}
                </p>
              </div>
            </div>

            {/* ── PENDING: withdraw button */}
            {isPending && (
              <div className="px-4 pb-4 pt-2 bg-amber-50 border-t border-amber-100 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                  Waiting for seller to respond…
                </p>
                <button
                  onClick={() => handleWithdraw(offer._id)}
                  disabled={withdrawing[offer._id]}
                  className="flex items-center gap-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  {withdrawing[offer._id] ? <SmallSpin /> : '🗑'}
                  Withdraw Offer
                </button>
              </div>
            )}

            {/* ── ACCEPTED: prompt to place order */}
            {isAccepted && (
              <div className="px-4 pb-4 pt-2 bg-green-50 border-t border-green-100 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm text-green-700 font-semibold">🎉 Seller accepted your offer!</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Place your order now at ₹{Number(offer.offerPrice).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => setOrderModal(offer)}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
                >
                  🛒 Place Order
                </button>
              </div>
            )}

            {/* ── COUNTERED: seller made a counter offer */}
            {isCountered && (
              <div className="px-4 pb-4 pt-3 bg-blue-50 border-t border-blue-100 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm shrink-0">
                    {(offer.seller?.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700">Seller made a counter offer:</p>
                    <p className="text-base font-bold text-blue-900 mt-0.5">
                      ₹{Number(offer.counterPrice || 0).toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-blue-600 ml-2">
                        ({snap?.price ? `${Math.round(((snap.price - offer.counterPrice) / snap.price) * 100)}% off listed` : ''})
                      </span>
                    </p>
                    {offer.counterMessage && (
                      <p className="text-xs text-blue-600 italic mt-1">"{offer.counterMessage}"</p>
                    )}
                  </div>
                </div>

                <div className="bg-white/70 rounded-lg p-3 border border-blue-100 text-xs text-blue-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Your offer</span>
                    <span className="font-medium">₹{Number(offer.offerPrice).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Counter offer</span>
                    <span>₹{Number(offer.counterPrice || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-xs text-blue-500">
                  To accept or decline this counter offer, please contact the seller via chat or make a new offer on the product page.
                </p>

                <div className="flex gap-2">
                  <Link
                    to={offer.product?._id ? `/product/${offer.product._id}` : '#'}
                    className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition"
                  >
                    🔄 Make New Offer
                  </Link>
                </div>
              </div>
            )}

            {/* ── REJECTED */}
            {offer.status === 'rejected' && (
              <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between gap-3">
                <p className="text-sm text-red-600 font-medium">❌ Seller declined this offer</p>
                {offer.product?._id && (
                  <Link
                    to={`/product/${offer.product._id}`}
                    className="text-xs text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 px-3 py-1.5 rounded-lg font-medium transition bg-white"
                  >
                    Try Again
                  </Link>
                )}
              </div>
            )}

            {/* ── COMPLETED */}
            {offer.status === 'completed' && (
              <div className="px-4 py-3 bg-gray-50 border-t flex items-center gap-3">
                <span className="text-base">🏁</span>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Order placed successfully</p>
                  {offer.orderId && (
                    <p className="text-xs text-gray-400">
                      Order #{(typeof offer.orderId === 'string'
                        ? offer.orderId
                        : offer.orderId?._id)?.slice(-8).toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BuyerOffers;
