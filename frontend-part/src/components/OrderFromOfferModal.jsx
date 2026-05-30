import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrderFromOfferApi, imgUrl } from '../api';

/**
 * OrderFromOfferModal
 * Props:
 *   offer    – the accepted offer object
 *   onClose  – close handler
 *   onSuccess(order) – called after order placed
 */
const OrderFromOfferModal = ({ offer, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', phone: '', street: '', city: '', country: 'India', postalCode: '',
    paymentMethod: 'cod',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const snap      = offer.productSnapshot;
  const imgSrc    = snap?.image ? imgUrl(snap.image) : '';
  const itemPrice = offer.offerPrice;
  const shipping  = itemPrice > 1000 ? 0 : 50;
  const total     = itemPrice + shipping;

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    if (!form.name.trim() || !form.phone.trim() || !form.city.trim())
      return setErr('Name, phone and city are required');

    setLoading(true);
    try {
      const d = await createOrderFromOfferApi(offer._id, {
        shippingAddress: {
          name:       form.name.trim(),
          phone:      form.phone.trim(),
          street:     form.street.trim(),
          city:       form.city.trim(),
          country:    form.country.trim(),
          postalCode: form.postalCode.trim(),
        },
        paymentMethod: form.paymentMethod,
      });
      onSuccess?.(d.order);
    } catch (e) {
      setErr(e.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">🛒 Place Order</h2>
            <p className="text-xs text-green-600 font-medium mt-0.5">✅ Offer Accepted — Order at negotiated price</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition text-lg leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product summary */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-center">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {imgSrc ? (
                <img src={imgSrc} alt={snap?.title}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/56x56?text=?'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">📦</div>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 line-clamp-1">{snap?.title || 'Product'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400 line-through">
                  ₹{Number(snap?.price || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-green-700 font-bold text-sm">
                  ₹{Number(itemPrice).toLocaleString('en-IN')}
                </span>
                <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
                  Offer Price
                </span>
              </div>
            </div>
          </div>

          {/* Shipping fields */}
          <p className="text-sm font-semibold text-gray-700">Shipping Address</p>
          {[
            ['name',       'Full Name *',          'text', 'John Doe'],
            ['phone',      'Phone *',              'tel',  '+91 9876543210'],
            ['street',     'Street / House No.',   'text', '123, MG Road'],
            ['city',       'City *',               'text', 'Mumbai'],
            ['postalCode', 'Postal Code',          'text', '400001'],
          ].map(([key, label, type, ph]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => f(key, e.target.value)}
                placeholder={ph}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          ))}

          {/* Payment method */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['cod',    '💵 Cash on Delivery'],
                ['upi',    '📲 UPI'],
                ['card',   '💳 Card'],
                ['wallet', '👛 Wallet'],
              ].map(([val, lbl]) => (
                <button
                  key={val} type="button"
                  onClick={() => f('paymentMethod', val)}
                  className={`border-2 rounded-lg py-2 text-xs font-medium transition ${
                    form.paymentMethod === val
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Price summary */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Offer Price</span>
              <span>₹{Number(itemPrice).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                {shipping === 0 ? 'FREE' : `₹${shipping}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 border-t pt-1.5">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            {snap?.price > itemPrice && (
              <div className="flex justify-between text-green-600 text-xs">
                <span>You saved</span>
                <span>₹{(snap.price - itemPrice).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {err}
            </div>
          )}

          {/* Confirm */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Spin /> Placing Order...</>
            ) : '✅ Confirm Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Spin = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

export default OrderFromOfferModal;
