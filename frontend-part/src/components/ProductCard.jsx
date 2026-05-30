import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { imgUrl } from '../api';

const conditionColor = {
  new:        'bg-green-100 text-green-700',
  'like-new': 'bg-blue-100 text-blue-700',
  good:       'bg-yellow-100 text-yellow-700',
  fair:       'bg-orange-100 text-orange-700',
  poor:       'bg-red-100 text-red-700',
};

const PLACEHOLDER = 'https://placehold.co/300x200/f3f4f6/9ca3af?text=No+Image';

const ProductCard = ({
  _id, title, price, originalPrice, images,
  condition, category, savedItems = [], setSavedItems,
  vendor, rating, numReviews,
}) => {
  const [imgError, setImgError] = useState(false);
  const rawSrc  = images?.[0];
  const src     = (!imgError && rawSrc) ? imgUrl(rawSrc) : PLACEHOLDER;
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSaved  = savedItems.some(i => i._id === _id);

  const discount = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const toggleSave = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setSavedItems(prev =>
      isSaved
        ? prev.filter(i => i._id !== _id)
        : [...prev, { _id, title, price, originalPrice, images, condition, category }]
    );
  };

  return (
    <Link to={`/product/${_id}`}
      className="bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden h-48 bg-gray-100 shrink-0">
        <img src={src} alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgError(true)} />

        {/* Wishlist */}
        <button onClick={toggleSave}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow transition z-10 text-sm ${isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}>
          {isSaved ? '❤️' : '🤍'}
        </button>

        {/* Condition badge */}
        {condition && (
          <span className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${conditionColor[condition] || 'bg-gray-100 text-gray-700'}`}>
            {condition}
          </span>
        )}

        {/* Discount badge */}
        {discount >= 5 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-0.5">{category || 'General'}</p>
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug flex-1">{title}</h3>

        {numReviews > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-amber-400 text-xs">{'★'.repeat(Math.min(5, Math.round(Number(rating) || 0)))}</span>
            <span className="text-xs text-gray-400">({numReviews})</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-bold text-green-600">₹{Number(price).toLocaleString('en-IN')}</span>
          {originalPrice > price && (
            <span className="text-xs text-gray-400 line-through">₹{Number(originalPrice).toLocaleString('en-IN')}</span>
          )}
        </div>

        {vendor?.name && <p className="text-xs text-gray-400 mt-1 truncate">by {vendor.name}</p>}
      </div>
    </Link>
  );
};

export default ProductCard;
