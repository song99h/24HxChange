import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductApi, addReviewApi, toggleWishlistApi, getOrCreateChatApi, placeOrderApi, imgUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import MakeOfferModal from '../components/MakeOfferModal';

/* ── Order Modal ─────────────────────────────────────────────────────────── */
const OrderModal = ({ product, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name:'', phone:'', street:'', city:'', country:'India', postalCode:'',
    paymentMethod:'cod', quantity:1,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const subtotal = product.price * form.quantity;
  const shipping = subtotal > 1000 ? 0 : 50;
  const total    = subtotal + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    if (!form.name || !form.phone || !form.city) return setErr('Name, phone and city are required');
    setLoading(true);
    try {
      await placeOrderApi({
        items: [{ product: product._id, quantity: Number(form.quantity) }],
        shippingAddress: {
          name: form.name, phone: form.phone, street: form.street,
          city: form.city, country: form.country, postalCode: form.postalCode,
        },
        paymentMethod: form.paymentMethod,
      });
      onSuccess();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <h2 className="text-lg font-bold">🛒 Place Order</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="bg-blue-50 rounded-xl p-3 flex gap-3 items-center">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {product.images?.[0] ? (
                <img src={imgUrl(product.images[0])} alt={product.title} className="w-full h-full object-cover"
                  onError={e => { e.target.onerror=null; e.target.src='https://placehold.co/56x56?text=?'; }} />
              ) : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 line-clamp-1">{product.title}</p>
              <p className="text-green-600 font-bold">₹{Number(product.price).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <select value={form.quantity} onChange={e => f('quantity', Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              {Array.from({ length: Math.min(product.stock || 1, 10) }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <p className="text-sm font-semibold text-gray-700 pt-1">Shipping Address</p>
          {[['name','Full Name *','text'],['phone','Phone *','tel'],['street','Street','text'],['city','City *','text'],['postalCode','Postal Code','text']].map(([k,lbl,type]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">{lbl}</label>
              <input type={type} value={form[k]} onChange={e => f(k, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          ))}

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {[['cod','💵 Cash on Delivery'],['upi','📲 UPI'],['card','💳 Card'],['wallet','👛 Wallet']].map(([val,lbl]) => (
                <button key={val} type="button" onClick={() => f('paymentMethod', val)}
                  className={`border-2 rounded-lg py-2 text-xs font-medium transition ${form.paymentMethod===val?'border-blue-600 bg-blue-50 text-blue-700':'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal ({form.quantity}×)</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span className={shipping===0?'text-green-600':''}>{shipping===0?'FREE':`₹${shipping}`}</span></div>
            <div className="flex justify-between font-bold text-gray-800 border-t pt-1"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          </div>

          {err && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{err}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
            {loading ? <><Spin /> Placing...</> : '✅ Confirm Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ── SellerCard: shows profile picture or initial ───────────────────────── */
const SellerCard = ({ vendor, isOwner, user, chatLoading, onChat }) => {
  const [avatarErr, setAvatarErr] = React.useState(false);
  const avatarSrc = vendor.avatar && !avatarErr ? imgUrl(vendor.avatar) : '';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
      {/* ✅ Profile picture or initial */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shrink-0 border-2 border-white shadow">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={vendor.name}
            className="w-full h-full object-cover"
            onError={() => setAvatarErr(true)}
          />
        ) : (
          <span>{vendor.name?.[0]?.toUpperCase() || '?'}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800">{vendor.name || 'Seller'}</p>
        <p className="text-xs text-gray-500">
          Member since {vendor.createdAt ? new Date(vendor.createdAt).getFullYear() : '—'}
        </p>
        {vendor.phone && (
          <p className="text-xs text-gray-400 mt-0.5">{vendor.phone}</p>
        )}
      </div>

      {!isOwner && user && (
        <button
          onClick={onChat}
          disabled={chatLoading}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
        >
          {chatLoading ? '...' : '💬 Chat'}
        </button>
      )}
    </div>
  );
};

const Spin = () => <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;

/* ── Main Component ──────────────────────────────────────────────────────── */
const ProductDetails = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [product, setProduct]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [selectedImg, setSelectedImg] = useState(0);
  const [imgErrors, setImgErrors]   = useState({});
  const [review, setReview]         = useState({ rating: 5, comment: '' });
  const [revLoading, setRevLoading] = useState(false);
  const [revErr, setRevErr]         = useState('');
  const [revOk, setRevOk]           = useState('');
  const [wishMsg, setWishMsg]       = useState('');
  const [chatLoading, setChatLoad]  = useState(false);
  const [showOrder, setShowOrder]   = useState(false);
  const [showOffer, setShowOffer]   = useState(false);
  const [orderDone, setOrderDone]   = useState(false);
  const [offerSent, setOfferSent]   = useState(false);

  useEffect(() => {
    setLoading(true); setError(''); setImgErrors({});
    getProductApi(id)
      .then(d => setProduct(d.product))
      .catch(e => setError(e.message || 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleWishlist = async () => {
    if (!user) return navigate('/login');
    try {
      const d = await toggleWishlistApi(id);
      setWishMsg(d.message);
      setTimeout(() => setWishMsg(''), 2500);
    } catch (e) { setWishMsg(e.message); setTimeout(() => setWishMsg(''), 2500); }
  };

  const handleChat = async () => {
    if (!user) return navigate('/login');
    if (!product?.vendor?._id) return;
    if (user._id === product.vendor._id) return;
    setChatLoad(true);
    try {
      await getOrCreateChatApi({ recipientId: product.vendor._id, productId: id });
      navigate('/chat');
    } catch (e) { alert(e.message); }
    finally { setChatLoad(false); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!review.comment.trim()) return setRevErr('Please write a comment');
    setRevLoading(true); setRevErr(''); setRevOk('');
    try {
      await addReviewApi(id, { rating: review.rating, comment: review.comment.trim() });
      const d = await getProductApi(id);
      setProduct(d.product);
      setReview({ rating: 5, comment: '' });
      setRevOk('Review submitted! ✅');
      setTimeout(() => setRevOk(''), 3000);
    } catch (e) { setRevErr(e.message || 'Failed to submit review'); }
    finally { setRevLoading(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !product) return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-xl font-semibold text-gray-700">{error || 'Product not found'}</p>
      <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline text-sm">← Back to Home</button>
    </div>
  );

  const imgs    = (product.images || []).filter(Boolean);
  const getImg  = i => imgErrors[i] ? '' : imgUrl(imgs[i] || '');
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const isOwner = user && product.vendor &&
    (user._id === product.vendor._id || user._id === product.vendor);

  const condBadge = {
    new:'bg-green-100 text-green-700', 'like-new':'bg-blue-100 text-blue-700',
    good:'bg-yellow-100 text-yellow-700', fair:'bg-orange-100 text-orange-700',
    poor:'bg-red-100 text-red-700',
  };

  return (
    <>
      {showOrder && (
        <OrderModal product={product} onClose={() => setShowOrder(false)}
          onSuccess={() => { setShowOrder(false); setOrderDone(true); }} />
      )}
      {/* ✅ Use MakeOfferModal component */}
      {showOffer && (
        <MakeOfferModal
          product={product}
          onClose={() => setShowOffer(false)}
          onSuccess={() => { setShowOffer(false); setOfferSent(true); setTimeout(() => setOfferSent(false), 4000); }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-5 flex items-center gap-1 flex-wrap">
          <button onClick={() => navigate('/')} className="hover:text-blue-600">Home</button>
          <span>›</span>
          <button onClick={() => navigate(`/?category=${product.category}`)} className="hover:text-blue-600">{product.category}</button>
          <span>›</span>
          <span className="text-gray-600 truncate max-w-xs">{product.title}</span>
        </nav>

        {/* Success banners */}
        {orderDone && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl mb-5 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold">Order placed successfully!</p>
              <button onClick={() => navigate('/my-orders')} className="text-sm underline">View my orders →</button>
            </div>
          </div>
        )}
        {offerSent && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-xl mb-5 flex items-center gap-3">
            <span className="text-2xl">📩</span>
            <div>
              <p className="font-semibold">Offer sent successfully!</p>
              <button onClick={() => navigate('/my-orders')} className="text-sm underline">Track your offers →</button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="bg-white rounded-2xl shadow-md overflow-hidden aspect-square flex items-center justify-center bg-gray-50">
              {imgs.length > 0 && getImg(selectedImg) ? (
                <img src={getImg(selectedImg)} alt={product.title}
                  className="w-full h-full object-contain p-3"
                  onError={() => setImgErrors(p => ({ ...p, [selectedImg]: true }))} />
              ) : (
                <div className="text-gray-300 text-center"><p className="text-6xl mb-2">📦</p><p className="text-sm">No image</p></div>
              )}
            </div>
            {imgs.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {imgs.map((src, i) => (
                  <button key={i} onClick={() => setSelectedImg(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition ${selectedImg===i?'border-blue-600':'border-gray-200 hover:border-blue-300'}`}>
                    <img src={imgUrl(src)} alt="" className="w-full h-full object-cover"
                      onError={e => { e.target.onerror=null; e.target.src='https://placehold.co/64x64?text=?'; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-800 leading-tight">{product.title}</h1>
              <button onClick={handleWishlist} title="Save" className="text-2xl hover:scale-110 transition shrink-0 mt-0.5">❤️</button>
            </div>
            {wishMsg && <p className="text-green-600 text-sm bg-green-50 border border-green-200 px-3 py-2 rounded-lg">{wishMsg}</p>}

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold text-green-600">₹{Number(product.price).toLocaleString('en-IN')}</span>
              {discount > 0 && (
                <><span className="text-gray-400 line-through text-lg">₹{Number(product.originalPrice).toLocaleString('en-IN')}</span>
                  <span className="bg-red-100 text-red-600 text-sm px-2 py-0.5 rounded-full font-semibold">{discount}% OFF</span></>
              )}
              {product.isNegotiable && (
                <span className="bg-amber-100 text-amber-700 text-sm px-2 py-0.5 rounded-full font-medium">💬 Negotiable</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex">{[1,2,3,4,5].map(s => <span key={s} className={`text-lg ${s<=Math.round(Number(product.rating||0))?'text-amber-400':'text-gray-200'}`}>★</span>)}</div>
              <span className="text-sm text-gray-500">({product.numReviews||0} review{product.numReviews!==1?'s':''})</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {product.condition && <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${condBadge[product.condition]||'bg-gray-100 text-gray-700'}`}>{product.condition}</span>}
              {product.stock > 0 && product.stock <= 5 && <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">Only {product.stock} left!</span>}
              {product.stock === 0 && <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">Out of Stock</span>}
            </div>

            <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-4 text-sm">
              {[['Category',product.category],['Condition',product.condition,true],['Stock',`${product.stock} available`],['Views',product.views||0],
                ...(product.location?.city?[['Location',`${product.location.city}${product.location.country?', '+product.location.country:''}`]]:[] ),
                ...(product.sold>0?[['Sold',product.sold]]:[]),
              ].map(([label,val,cap]) => (
                <div key={label}><span className="text-gray-400">{label}:</span><span className={`font-medium ml-1 text-gray-800 text-xs ${cap?'capitalize':''}`}>{val}</span></div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((t,i) => <span key={i} className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">#{t}</span>)}
              </div>
            )}

            {/* Seller card with profile picture */}
            {product.vendor && (
              <SellerCard
                vendor={product.vendor}
                isOwner={isOwner}
                user={user}
                chatLoading={chatLoading}
                onChat={handleChat}
              />
            )}

            {/* ── Action buttons ── */}
            {!isOwner ? (
              <div className="space-y-2 pt-1">
                {product.stock > 0 ? (
                  <button
                    onClick={() => { if (!user) { navigate('/login'); return; } setShowOrder(true); }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-base transition shadow-md flex items-center justify-center gap-2">
                    🛒 Order Now
                  </button>
                ) : (
                  <div className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-bold text-base text-center">Out of Stock</div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { if (!user) { navigate('/login'); return; } handleChat(); }} disabled={chatLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-1.5">
                    {chatLoading ? '...' : '💬 Chat with Seller'}
                  </button>
                  {/* ✅ Make Offer button — only if negotiable */}
                  {product.isNegotiable ? (
                    <button
                      onClick={() => { if (!user) { navigate('/login'); return; } setShowOffer(true); }}
                      className="bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-1.5">
                      📩 Make Offer
                    </button>
                  ) : (
                    <button onClick={handleWishlist}
                      className="border-2 border-red-400 text-red-500 hover:bg-red-50 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-1.5">
                      ❤️ Save Item
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={() => navigate(`/edit-product/${product._id}`)}
                className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-xl font-bold text-sm transition">
                ✏️ Edit My Product
              </button>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-5">
            Reviews <span className="text-gray-400 font-normal text-base">({product.numReviews||0})</span>
          </h2>
          {user && !isOwner ? (
            <form onSubmit={handleReview} className="bg-white rounded-2xl shadow p-5 mb-6 space-y-4">
              <h3 className="font-semibold text-gray-700">Write a Review</h3>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setReview(r => ({...r,rating:s}))}
                    className={`text-2xl transition-transform hover:scale-110 ${s<=review.rating?'text-amber-400':'text-gray-200'}`}>★</button>
                ))}
              </div>
              <textarea value={review.comment} onChange={e => setReview(r => ({...r,comment:e.target.value}))}
                placeholder="Share your experience with this product..." rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              {revErr && <p className="text-red-600 text-sm">{revErr}</p>}
              {revOk  && <p className="text-green-600 text-sm">{revOk}</p>}
              <button type="submit" disabled={revLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg text-sm font-semibold transition">
                {revLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : !user ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center text-sm">
              <button onClick={() => navigate('/login')} className="text-blue-700 font-semibold underline">Sign in</button> to leave a review
            </div>
          ) : null}

          <div className="space-y-3">
            {(!product.reviews || product.reviews.length === 0) ? (
              <div className="text-center py-10 bg-white rounded-xl shadow text-gray-400">
                <p className="text-3xl mb-2">💬</p><p className="font-medium">No reviews yet — be the first!</p>
              </div>
            ) : product.reviews.map(r => (
              <div key={r._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-full text-white text-sm flex items-center justify-center font-bold shrink-0">
                      {(r.name||'?')[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{r.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm">{'★'.repeat(r.rating)}</span>
                    <span className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;
