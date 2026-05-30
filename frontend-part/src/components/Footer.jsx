import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 mt-12 pt-10 pb-6 px-6">
    <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
      <div>
        <h3 className="text-white font-bold text-lg mb-3">
          24H<span className="text-red-400">x</span>Change
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          India's fastest growing multi-vendor marketplace. Buy, sell, and discover amazing deals 24 hours a day.
        </p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3">Quick Links</h4>
        <ul className="space-y-2 text-sm">
          {[['Home','/'],['My Orders','/my-orders'],['Saved Items','/saved'],['Become a Seller','/become-seller']].map(([l,t]) => (
            <li key={t}><Link to={t} className="hover:text-white transition">{l}</Link></li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3">Categories</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          {['Electronics','Fashion','Home & Garden','Sports','Books','Vehicles'].map(c => (
            <li key={c}><Link to={`/?category=${c}`} className="hover:text-white transition">{c}</Link></li>
          ))}
        </ul>
      </div>
     <div>
          <h2 className="text-xl font-semibold text-white mb-4">Follow Us</h2>
          <div className="flex space-x-4">
            <a href="https://www.facebook.com/share/17VmAmUJEQ/"   target="_blank" 
  rel="noopener noreferrer"  className="transform transition duration-300 hover:scale-140">
              <img src="Facebook.jpeg" alt="" height={40} width={40} className='rounded border-2 border-amber-500'/>
            </a>
            <a href="https://www.instagram.com/hsdeep_0654?utm_source=qr&igsh=MXZiMG53bmY5eXRkZg=="   target="_blank" 
  rel="noopener noreferrer" className="transform transition duration-300 hover:scale-140">
             <img src="Instagram.webp" alt="" height={40} width={40} className='rounded border-2 border-amber-500'/>
            </a>
            <a href="https://www.linkedin.com/in/harshdeep-singh-26579b319?utm_source=share_via&utm_content=profile&utm_medium=member_android" 
 target="_blank" rel="noopener noreferrer" className="transform transition duration-300 hover:scale-140">
              <img src="linkdin.jpeg" alt="" height={40} width={40} className='rounded border-2 border-amber-500'/>
            </a>
          </div>
        </div>
     </div>
    <div className="border-t border-gray-800 pt-4 text-center text-xs text-gray-500">
      © {new Date().getFullYear()} 24HxChange. All rights reserved. Made with ❤️ in India.
    </div>
  </footer>
);

export default Footer;
