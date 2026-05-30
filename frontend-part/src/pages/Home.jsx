import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { getProductsApi } from '../api';

const FALLBACK = [
  { _id:'f1', title:'Wireless Headphones',    price:999,   originalPrice:1999, images:['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?w=400'],  category:'Electronics', condition:'good',     numReviews:0, rating:0 },
  { _id:'f2', title:'Smart Watch',            price:1999,  originalPrice:2999, images:['https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?w=400'],    category:'Electronics', condition:'like-new', numReviews:0, rating:0 },
  { _id:'f3', title:'Running Shoes',          price:1499,  originalPrice:2995, images:['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?w=400'],  category:'Fashion',     condition:'new',      numReviews:0, rating:0 },
  { _id:'f4', title:'Smartphone 5G',          price:9999,  originalPrice:14999,images:['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?w=400'],    category:'Electronics', condition:'good',     numReviews:0, rating:0 },
  { _id:'f5', title:'Vintage Wall Clock',     price:799,   originalPrice:0,    images:['https://images.pexels.com/photos/1095601/pexels-photo-1095601.jpeg?w=400'],  category:'Home',        condition:'fair',     numReviews:0, rating:0 },
  { _id:'f6', title:'Mountain Bike',          price:12500, originalPrice:18000,images:['https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?w=400'],    category:'Sports',      condition:'good',     numReviews:0, rating:0 },
  { _id:'f7', title:'Leather Shoulder Bag',   price:2499,  originalPrice:3999, images:['https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?w=400'],  category:'Fashion',     condition:'new',      numReviews:0, rating:0 },
  { _id:'f8', title:'LED Desk Lamp',          price:549,   originalPrice:999,  images:['https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?w=400'],  category:'Home',        condition:'like-new', numReviews:0, rating:0 },
];

const CATEGORIES = [
  { name:'Electronics',icon:'📱' },{ name:'Fashion',  icon:'👗' },
  { name:'Home',       icon:'🏠' },{ name:'Sports',   icon:'⚽' },
  { name:'Books',      icon:'📚' },{ name:'Vehicles', icon:'🚗' },
  { name:'Furniture',  icon:'🛋️' },{ name:'Toys',     icon:'🧸' },
];

const Home = ({ savedItems, setSavedItems }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('');
  const [sort, setSort]         = useState('');
  const [offline, setOffline]   = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const search = new URLSearchParams(location.search).get('search') || '';
  const catQ   = new URLSearchParams(location.search).get('category') || '';

  useEffect(() => { if (catQ) setCategory(catQ); }, [catQ]);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search)   p.set('search',   search);
    if (category) p.set('category', category);
    if (sort)     p.set('sort',     sort);

    getProductsApi(p.toString())
      .then(d => { setOffline(false); setProducts(d.products || []); })
      .catch(() => {
        setOffline(true);
        let fb = FALLBACK;
        if (category) fb = fb.filter(p => p.category === category);
        if (search)   fb = fb.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
        setProducts(fb);
      })
      .finally(() => setLoading(false));
  }, [search, category, sort]);

  const display = loading ? [] : (products.length ? products : FALLBACK);

  const setAndNavCategory = (name) => {
    const next = category === name ? '' : name;
    setCategory(next);
    navigate(next ? `/?category=${encodeURIComponent(next)}` : '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {offline && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs text-center py-2 px-4">
          ⚠️ Backend not connected — showing demo products. Run the backend server to see live listings.
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-r from-gray-900 via-blue-950 to-gray-900 text-white py-14 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight">
          Buy & Sell <span className="text-amber-400">Anything</span>
        </h1>
        <p className="text-gray-300 text-lg mb-8">India's fastest growing multi-vendor marketplace</p>
        <form onSubmit={e => { e.preventDefault(); const s = e.target.q.value.trim(); navigate(s ? `/?search=${encodeURIComponent(s)}` : '/'); }}
          className="flex max-w-xl mx-auto bg-white rounded-xl overflow-hidden shadow-lg">
          <input name="q" key={search} defaultValue={search} placeholder="Search products, brands, categories..."
            className="flex-1 px-4 py-3 text-gray-900 outline-none text-sm" />
          <button type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-semibold transition text-sm shrink-0">
            🔍 Search
          </button>
        </form>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-3">
        <h2 className="text-base font-bold text-gray-700 mb-3 uppercase tracking-wide">Browse Categories</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setCategory(''); navigate('/'); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${!category ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:border-blue-400 text-gray-700'}`}>
            All
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat.name} onClick={() => setAndNavCategory(cat.name)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${category === cat.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:border-blue-400 text-gray-700'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 pb-14">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-gray-800">
            {search ? `Results for "${search}"` : category || 'Latest Listings'}
            <span className="ml-2 text-sm font-normal text-gray-500">({display.length} items)</span>
          </h2>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
            <option value="">Sort: Newest</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : display.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-xl font-semibold text-gray-600">No products found</p>
            <button onClick={() => { setCategory(''); navigate('/'); }}
              className="mt-4 text-blue-600 underline text-sm">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {display.map(product => (
              <ProductCard key={product._id} {...product} savedItems={savedItems} setSavedItems={setSavedItems} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Home;
