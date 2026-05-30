import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductApi, updateProductApi, imgUrl } from '../api';
import { useAuth } from '../context/AuthContext';

const CATS  = ['Electronics','Fashion','Home','Sports','Books','Vehicles','Furniture','Toys','Other'];
const CONDS = [{ v:'new',l:'New' },{ v:'like-new',l:'Like New' },{ v:'good',l:'Good' },{ v:'fair',l:'Fair' },{ v:'poor',l:'Poor' }];

const EditProduct = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm]             = useState(null);
  const [existingImgs, setExisting] = useState([]);
  const [newImages, setNewImgs]     = useState([]);
  const [previews, setPreviews]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState('');
  const [ok, setOk]                 = useState('');

  useEffect(() => {
    getProductApi(id)
      .then(d => {
        const p = d.product;
        // Only owner or admin can edit
        const vendorId = p.vendor?._id || p.vendor;
        if (user && vendorId !== user._id && user.role !== 'admin') {
          navigate('/vendor-dashboard'); return;
        }
        setForm({
          title:         p.title         || '',
          description:   p.description   || '',
          price:         p.price         || '',
          originalPrice: p.originalPrice || '',
          category:      p.category      || '',
          condition:     p.condition     || 'good',
          stock:         p.stock         || 1,
          isNegotiable:  p.isNegotiable  || false,
          tags:          (p.tags || []).join(', '),
          city:          p.location?.city    || '',
          country:       p.location?.country || '',
        });
        setExisting(p.images || []);
      })
      .catch(e => setErr(e.message || 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const ch = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNewImgs = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - existingImgs.length);
    previews.forEach(url => URL.revokeObjectURL(url));
    setNewImgs(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeExisting = (idx) => setExisting(p => p.filter((_,i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    if (!form.title.trim())       return setErr('Title is required');
    if (!form.description.trim()) return setErr('Description is required');
    if (!form.price || Number(form.price) <= 0) return setErr('Valid price is required');
    if (!form.category)           return setErr('Category is required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title',          form.title.trim());
      fd.append('description',    form.description.trim());
      fd.append('price',          form.price);
      fd.append('originalPrice',  form.originalPrice || '0');
      fd.append('category',       form.category);
      fd.append('condition',      form.condition);
      fd.append('stock',          form.stock);
      fd.append('isNegotiable',   form.isNegotiable ? 'true' : 'false');
      fd.append('location',       JSON.stringify({ city: form.city.trim(), country: form.country.trim() }));
      fd.append('tags',           JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
      fd.append('existingImages', JSON.stringify(existingImgs));
      newImages.forEach(img => fd.append('images', img));
      await updateProductApi(id, fd);
      setOk('Product updated! ✅');
      setTimeout(() => navigate('/vendor-dashboard'), 1500);
    } catch (e) { setErr(e.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!form) return (
    <div className="text-center py-20 text-gray-500">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-lg font-semibold">{err || 'Product not found'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 underline text-sm">Go back</button>
    </div>
  );

  const totalImgs = existingImgs.length + newImages.length;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">✏️ Edit Product</h1>
            <p className="text-gray-500 text-sm mt-0.5">Update your listing details</p>
          </div>
        </div>

        {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex justify-between"><span>{err}</span><button onClick={() => setErr('')} className="font-bold">✕</button></div>}
        {ok  && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{ok}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-5">

          {/* Existing images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Images <span className="text-gray-400 font-normal">({existingImgs.length}/5 — hover to remove)</span>
            </label>
            {existingImgs.length > 0 ? (
              <div className="flex gap-2 flex-wrap mb-3">
                {existingImgs.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={imgUrl(src)} alt=""
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      onError={e => { e.target.onerror=null; e.target.src='https://placehold.co/80x80?text=?'; }} />
                    <button type="button" onClick={() => removeExisting(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-gray-400 mb-3">No current images</p>}

            {totalImgs < 5 && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Images <span className="text-gray-400 font-normal">(up to {5 - existingImgs.length} more)</span></label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition"
                  onClick={() => document.getElementById('edit-imgs').click()}>
                  <input type="file" id="edit-imgs" multiple accept="image/*" onChange={handleNewImgs} className="hidden" />
                  {previews.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {previews.map((src, i) => <img key={i} src={src} alt="" className="w-20 h-20 object-cover rounded-lg" />)}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-3">
                      <p className="text-2xl mb-1">📸</p><p className="text-sm">Click to add images</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input name="title" value={form.title} onChange={ch} required maxLength={120}
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea name="description" value={form.description} onChange={ch} required rows={4}
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition" />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
              <input name="price" type="number" min="1" value={form.price} onChange={ch} required
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
              <input name="originalPrice" type="number" min="0" value={form.originalPrice} onChange={ch}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select name="category" value={form.category} onChange={ch} required
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                <option value="">Select...</option>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
              <select name="condition" value={form.condition} onChange={ch}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                {CONDS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            </div>
          </div>

          {/* Stock & Negotiable */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={ch}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div className="flex items-center pt-7">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" name="isNegotiable" checked={form.isNegotiable} onChange={ch} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-gray-700 font-medium">Price Negotiable</span>
              </label>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input name="city" value={form.city} onChange={ch} placeholder="e.g. Mumbai"
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input name="country" value={form.country} onChange={ch} placeholder="e.g. India"
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
            <input name="tags" value={form.tags} onChange={ch} placeholder="e.g. iphone, apple, smartphone"
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
