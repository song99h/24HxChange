import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProductApi } from '../api';

const CATS = ['Electronics','Fashion','Home','Sports','Books','Vehicles','Furniture','Toys','Other'];
const CONDS = [{ v:'new',l:'New' },{ v:'like-new',l:'Like New' },{ v:'good',l:'Good' },{ v:'fair',l:'Fair' },{ v:'poor',l:'Poor' }];

const AddProduct = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title:'', description:'', price:'', originalPrice:'',
    category:'', condition:'good', stock:'1', isNegotiable:false,
    tags:'', city:'', country:'',
  });
  const [images, setImages]   = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const ch = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImgs = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    previews.forEach(url => URL.revokeObjectURL(url));
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImg = (i) => {
    URL.revokeObjectURL(previews[i]);
    setImages(p => p.filter((_,idx) => idx !== i));
    setPreviews(p => p.filter((_,idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    if (!form.title.trim())       return setErr('Title is required');
    if (!form.description.trim()) return setErr('Description is required');
    if (!form.price || Number(form.price) <= 0) return setErr('Valid price is required');
    if (!form.category)           return setErr('Category is required');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title',         form.title.trim());
      fd.append('description',   form.description.trim());
      fd.append('price',         form.price);
      fd.append('originalPrice', form.originalPrice || '0');
      fd.append('category',      form.category);
      fd.append('condition',     form.condition);
      fd.append('stock',         form.stock || '1');
      fd.append('isNegotiable',  form.isNegotiable ? 'true' : 'false');
      fd.append('location',      JSON.stringify({ city: form.city.trim(), country: form.country.trim() }));
      fd.append('tags',          JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
      images.forEach(img => fd.append('images', img));
      await createProductApi(fd);
      navigate('/vendor-dashboard', { state: { newProduct: true } });
    } catch (e) { setErr(e.message || 'Failed to create product'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📦 Add New Product</h1>
          <p className="text-gray-500 text-sm mt-1">List your item for sale on 24HxChange</p>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm flex justify-between">
            <span>{err}</span>
            <button onClick={() => setErr('')} className="font-bold ml-2">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-5">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images (up to 5)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition"
              onClick={() => document.getElementById('prod-imgs').click()}>
              <input type="file" id="prod-imgs" multiple accept="image/*" onChange={handleImgs} className="hidden" />
              {previews.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      <button type="button" onClick={ev => { ev.stopPropagation(); removeImg(i); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        ✕
                      </button>
                    </div>
                  ))}
                  {previews.length < 5 && <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-2xl">+</div>}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  <p className="text-3xl mb-1">📸</p>
                  <p className="text-sm">Click to upload images</p>
                  <p className="text-xs mt-0.5">PNG, JPG, WEBP up to 5MB each</p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input name="title" value={form.title} onChange={ch} required maxLength={120} placeholder="e.g. iPhone 14 Pro Max 256GB"
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea name="description" value={form.description} onChange={ch} required rows={4}
              placeholder="Describe your product — condition, features, reason for selling..."
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
              <input name="originalPrice" type="number" min="0" value={form.originalPrice} onChange={ch} placeholder="Optional"
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
              <input name="stock" type="number" min="1" value={form.stock} onChange={ch}
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
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : 'Add Product'}
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-gray-400 mt-3">Products go live immediately after submission.</p>
      </div>
    </div>
  );
};

export default AddProduct;
