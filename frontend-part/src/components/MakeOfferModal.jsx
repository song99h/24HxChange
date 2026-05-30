import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOfferApi, imgUrl } from '../api';
import { useAuth } from '../context/AuthContext';

/**
 * MakeOfferModal  (fixed + enhanced)
 * Props:
 *   product     – full product object
 *   onClose     – close handler
 *   onSuccess(offer) – called after offer created/updated
 */
const MakeOfferModal = ({ product, onClose, onSuccess }) => {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  // ── FIX: redirect AFTER render (no conditional hook violation) ──
  useEffect(() => {
    if (!user) { onClose?.(); navigate('/login'); }
  }, [user]); // eslint-disable-line

  const [offerPrice, setOfferPrice] = useState(
    () => product?.price ? Math.round(product.price * 0.85) : ''
  );
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');
  const [success, setSuccess]   = useState(null); // { offer, updated }

  if (!product) return null;

  const price      = Number(product.price) || 0;
  const offer      = Number(offerPrice)    || 0;
  const savings    = price - offer;
  const savingsPct = price > 0 ? Math.round((savings / price) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    // ── Validations ──
    if (!offer || offer <= 0)
      return setErr('Please enter a valid offer price greater than ₹0.');
    if (offer > price * 2)
      return setErr('Offer price is too high. Please enter a reasonable amount.');
    if (offer > price * 1.1)
      return setErr('Your offer is higher than the listed price — are you sure?');

    setLoading(true);
    try {
      const d = await createOfferApi({
        productId:  product._id,
        offerPrice: offer,
        message:    message.trim(),
      });
      // ── FIX: show success state before closing ──
      setSuccess({ offer: d.offer, updated: d.updated });
    } catch (e) {
      // ── FIX: parse backend error messages properly ──
      const msg = e?.response?.data?.message || e?.message || 'Failed to send offer. Please try again.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    onSuccess?.(success.offer);
    onClose?.();
  };

  const imgSrc = product.images?.[0] ? imgUrl(product.images[0]) : '';

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">📩 Make an Offer</h2>
            <p className="text-xs text-gray-500 mt-0.5">Negotiate a price with the seller</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* ── SUCCESS STATE ── */}
        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto">
              {success.updated ? '🔄' : '🎉'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {success.updated ? 'Offer Updated!' : 'Offer Sent!'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {success.updated
                  ? `Your offer has been updated to ₹${Number(success.offer?.offerPrice).toLocaleString('en-IN')}`
                  : `Your offer of ₹${Number(success.offer?.offerPrice).toLocaleString('en-IN')} has been sent to the seller`
                }
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              💡 You'll be notified when the seller responds. Check <strong>My Offers</strong> in your orders page.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/my-orders')}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
              >
                View My Offers
              </button>
              <button
                onClick={handleDone}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold transition text-sm"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ── FORM STATE ── */
          <div className="p-6 space-y-5">
            {/* Product preview */}
            <div className="flex gap-3 items-center bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                {imgSrc ? (
                  <img src={imgSrc} alt={product.title}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/56x56?text=?'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 line-clamp-1">{product.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Listed price:{' '}
                  <span className="font-bold text-gray-700">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                </p>
                {product.vendor?.name && (
                  <p className="text-xs text-gray-400 mt-0.5">Seller: {product.vendor.name}</p>
                )}
              </div>
            </div>

            {/* Offer price input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Offer Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">₹</span>
                <input
                  type="number"
                  min={1}
                  max={price * 2}
                  value={offerPrice}
                  onChange={e => { setOfferPrice(e.target.value); setErr(''); }}
                  className="w-full border border-gray-300 pl-8 pr-4 py-3 rounded-lg text-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                  placeholder="Enter amount"
                />
              </div>

              {/* Savings indicator */}
              {offer > 0 && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {savings > 0 ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Save ₹{savings.toLocaleString('en-IN')} ({savingsPct}% off)
                    </span>
                  ) : savings < 0 ? (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                      ₹{Math.abs(savings).toLocaleString('en-IN')} above listed price
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      At asking price
                    </span>
                  )}
                </div>
              )}

              {/* Quick preset buttons */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {[
                  { label: '90%', pct: 90 },
                  { label: '80%', pct: 80 },
                  { label: '70%', pct: 70 },
                  { label: '60%', pct: 60 },
                ].map(({ label, pct }) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => { setOfferPrice(Math.round(price * pct / 100)); setErr(''); }}
                    className={`text-xs border rounded-full px-3 py-1 transition ${
                      offer === Math.round(price * pct / 100)
                        ? 'bg-amber-100 border-amber-400 text-amber-700 font-semibold'
                        : 'border-gray-300 hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {label} · ₹{Math.round(price * pct / 100).toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message to Seller{' '}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="e.g. I can pick it up immediately, interested in bulk order..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
              />
              <p className="text-right text-xs text-gray-400 mt-0.5">{message.length}/300</p>
            </div>

            {/* FIX: re-offer note */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-700">
              💡 If you already have a pending offer on this product, it will be <strong>updated</strong> to this new price.
            </div>

            {/* Error */}
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{err}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !offerPrice}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-2.5 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2"
              >
                {loading ? <><Spin /> Sending...</> : '📩 Send Offer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Spin = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

export default MakeOfferModal;
