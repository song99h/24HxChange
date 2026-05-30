import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const SavedItems = ({ savedItems = [], setSavedItems }) => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-800">❤️ Saved Items</h1>
      {savedItems.length > 0 && (
        <button onClick={() => setSavedItems([])}
          className="text-sm text-red-500 hover:text-red-700 transition font-medium">
          Clear all
        </button>
      )}
    </div>

    {savedItems.length === 0 ? (
      <div className="text-center py-20 text-gray-400">
        <p className="text-5xl mb-4">❤️</p>
        <p className="text-xl font-semibold text-gray-600">No saved items yet</p>
        <p className="text-sm mt-2">Tap the ❤️ icon on any product to save it</p>
        <Link to="/"
          className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition">
          Browse Products
        </Link>
      </div>
    ) : (
      <>
        <p className="text-sm text-gray-500 mb-5">
          {savedItems.length} item{savedItems.length !== 1 ? 's' : ''} saved
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {savedItems.map(item => (
            <ProductCard key={item._id} {...item} savedItems={savedItems} setSavedItems={setSavedItems} />
          ))}
        </div>
      </>
    )}
  </div>
);

export default SavedItems;
