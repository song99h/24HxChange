import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSellerOffersApi, respondToOfferApi, imgUrl } from '../api';

const STATUS_STYLE = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  accepted:  'bg-green-100 text-green-700 border-green-200',
  rejected:  'bg-red-100 text-red-700 border-red-200',
  countered: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const SellerOffers = () => {
  const [offers, setOffers]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [err, setErr]               = useState('');
  const [responding, setResponding] = useState({});
  const [counter, setCounter]       = useState({});   // { [offerId]: { price, message } }
  const [filter, setFilter]         = useState('all');

  useEffect(() => {
    getSellerOffersApi()
      .then(d  => setOffers(d.offers || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const respond = async (id, action) => {
    setResponding(p => ({ ...p, [id]: true }));
    try {
      const body = { action };
      if (action === 'countered') {
        const c = counter[id] || {};
        if (!c.price || Number(c.price) <= 0) {
          alert('Please enter a valid counter price');
          return;
        }
        body.counterPrice   = Number(c.price);
        body.counterMessage = c.message?.trim() || '';
      }
      const d = await respondToOfferApi(id, body);
      setOffers(p => p.map(o => o._id === id ? d.offer : o));
    } catch (e) {
      alert(e.message || 'Failed to respond to offer');
    } finally {
      setResponding(p => ({ ...p, [id]: false }));
    }
  };

  const setCounterField = (id, field, value) =>
    setCounter(p => ({ ...p, [id]: { ...(p[id] || {}), [field]: value } }));

  const FILTERS = ['all', 'pending', 'accepted', 'rejected', 'countered', 'completed'];

  const filtered = filter === 'all' ? offers : offers.filter(o => o.status === filter);
  const pendingCount = offers.filter(o => o.status === 'pending').length;

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (err) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{err}</div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Received Offers
            {pendingCount > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingCount} new
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">Respond to buyer offers on your products</p>
        </div>
        <span className="text-sm text-gray-400">{filtered.length} offer{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? `All (${offers.length})` : `${f} (${offers.filter(o => o.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📩</p>
          <p className="font-medium text-gray-600">
            {filter === 'all' ? 'No offers received yet' : `No ${filter} offers`}
          </p>
          <p className="text-sm mt-1 text-gray-400">
            {filter === 'all'
              ? 'When buyers make offers on your products, they appear here'
              : 'Switch to "all" to see all offers'}
          </p>
        </div>
      )}

      {/* Offer cards */}
      {filtered.map(offer => {
        const snap = offer.productSnapshot;
        const img  = snap?.image || offer.product?.images?.[0] || '';
        const c    = counter[offer._id] || {};
        const isPending = offer.status === 'pending';

        return (
          <div key={offer._id}
            className={`bg-white rounded-xl shadow overflow-hidden ${isPending ? 'border-l-4 border-l-amber-400' : ''}`}>

            {/* Main info row */}
            <div className="p-4 flex gap-4 items-start flex-wrap">
              {/* Product image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                {img ? (
                  <img src={imgUrl(img)} alt={snap?.title || 'Product'}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/64x64?text=?'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                {/* Product name */}
                <Link
                  to={offer.product?._id ? `/product/${offer.product._id}` : '#'}
                  className="font-semibold text-gray-800 hover:text-blue-600 transition truncate block text-sm"
                >
                  {snap?.title || offer.product?.title || 'Product'}
                </Link>

                {/* Listed price vs offer */}
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">
                    Listed: ₹{Number(snap?.price || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-blue-600 font-bold text-sm">
                    Offer: ₹{Number(offer.offerPrice).toLocaleString('en-IN')}
                  </span>
                  {snap?.price > 0 && (
                    <span className="text-xs text-orange-500 font-medium">
                      ({Math.round(((snap.price - offer.offerPrice) / snap.price) * 100)}% below)
                    </span>
                  )}
                </div>

                {/* Buyer info */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(offer.buyer?.name || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{offer.buyer?.name || '—'}</span>
                  {offer.buyer?.email && (
                    <span className="text-xs text-gray-400">({offer.buyer.email})</span>
                  )}
                  {offer.buyer?.phone && (
                    <span className="text-xs text-gray-400">• {offer.buyer.phone}</span>
                  )}
                </div>

                {/* Buyer message */}
                {offer.message && (
                  <p className="text-xs text-gray-500 italic mt-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    "{offer.message}"
                  </p>
                )}
              </div>

              {/* Status badge */}
              <div className="shrink-0 text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize border ${STATUS_STYLE[offer.status] || ''}`}>
                  {offer.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('en-IN') : ''}
                </p>
              </div>
            </div>

            {/* ── PENDING: Counter offer input + action buttons ── */}
            {isPending && (
              <>
                {/* Counter offer inputs */}
                <div className="px-4 pb-3 bg-amber-50 border-t border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 pt-3 mb-2">
                    💬 Optional Counter Offer
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        type="number" min="1"
                        placeholder="Counter price"
                        value={c.price || ''}
                        onChange={e => setCounterField(offer._id, 'price', e.target.value)}
                        className="border border-gray-300 rounded-lg pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-36"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Message to buyer (optional)"
                      value={c.message || ''}
                      onChange={e => setCounterField(offer._id, 'message', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 min-w-32"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-4 pb-4 bg-amber-50 border-t border-amber-100 flex gap-2 flex-wrap pt-2">
                  <button
                    onClick={() => respond(offer._id, 'accepted')}
                    disabled={responding[offer._id]}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5"
                  >
                    {responding[offer._id] ? <SmallSpin /> : '✅'} Accept
                  </button>
                  <button
                    onClick={() => respond(offer._id, 'countered')}
                    disabled={responding[offer._id] || !c.price}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5"
                  >
                    {responding[offer._id] ? <SmallSpin /> : '💬'} Counter
                  </button>
                  <button
                    onClick={() => respond(offer._id, 'rejected')}
                    disabled={responding[offer._id]}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5"
                  >
                    {responding[offer._id] ? <SmallSpin /> : '❌'} Reject
                  </button>
                </div>
              </>
            )}

            {/* ── ACCEPTED: reminder to wait for buyer to order ── */}
            {offer.status === 'accepted' && (
              <div className="px-4 py-3 bg-green-50 border-t border-green-100 flex items-center gap-2">
                <span className="text-base">⏳</span>
                <p className="text-sm text-green-700 font-medium">
                  Accepted — waiting for buyer to place order
                </p>
              </div>
            )}

            {/* ── COMPLETED: order placed ── */}
            {offer.status === 'completed' && (
              <div className="px-4 py-3 bg-gray-50 border-t flex items-center gap-2">
                <span className="text-base">✅</span>
                <p className="text-sm text-gray-600 font-medium">Order placed by buyer</p>
                {offer.orderId && (
                  <span className="text-xs text-gray-400">
                    #{(typeof offer.orderId === 'string'
                        ? offer.orderId
                        : offer.orderId?._id)?.slice(-8).toUpperCase()}
                  </span>
                )}
              </div>
            )}

            {/* ── COUNTERED: reminder ── */}
            {offer.status === 'countered' && (
              <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                <p className="text-sm text-blue-700 font-medium">
                  Your counter: ₹{Number(offer.counterPrice || 0).toLocaleString('en-IN')}
                  {offer.counterMessage && (
                    <span className="ml-2 text-xs font-normal italic">"{offer.counterMessage}"</span>
                  )}
                </p>
                <p className="text-xs text-blue-500 mt-0.5">Waiting for buyer to respond</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const SmallSpin = () => (
  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

export default SellerOffers;
