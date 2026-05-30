/**
 
seed.js — 24HxChange Demo Data Seeder
  Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');
const Product  = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/multivendor';

const USERS = [
  { name: 'Admin User',  email: 'admin@24hxchange.com',  password: 'Admin@123',  role: 'admin'  },
  { name: 'Demo Seller', email: 'seller@24hxchange.com', password: 'Seller@123', role: 'vendor' },
  { name: 'Demo Buyer',  email: 'buyer@24hxchange.com',  password: 'Buyer@123',  role: 'user'   },
];

const makeProducts = (sellerId) => [
  {
    vendor: sellerId, title: 'Apple iPhone 14 Pro – 256GB Deep Purple',
    description: 'Excellent condition iPhone 14 Pro. Original box, charger and earphones included. Always kept in a case. No scratches.',
    price: 74999, originalPrice: 89999, category: 'Electronics',
    condition: 'like-new', stock: 2, isNegotiable: true, images: [],
    tags: ['iphone','apple','smartphone','ios'],
    location: { city: 'Mumbai', country: 'India' },
    isApproved: true, isActive: true, isFeatured: true, views: 142, sold: 3,
  },
  {
    vendor: sellerId, title: 'Sony WH-1000XM5 Noise-Cancelling Headphones',
    description: 'Used 3 months, perfect condition. All accessories included with carry case.',
    price: 18999, originalPrice: 29990, category: 'Electronics',
    condition: 'good', stock: 1, isNegotiable: true, images: [],
    tags: ['sony','headphones','wireless','anc'],
    location: { city: 'Bangalore', country: 'India' },
    isApproved: true, isActive: true, isFeatured: false, views: 87, sold: 1,
  },
  {
    vendor: sellerId, title: 'MacBook Pro 14" M2 Pro – 16GB / 512GB',
    description: 'Used 6 months, pristine condition. AppleCare+ active. Original charger included.',
    price: 155000, originalPrice: 199900, category: 'Electronics',
    condition: 'like-new', stock: 1, isNegotiable: true, images: [],
    tags: ['macbook','apple','laptop','m2'],
    location: { city: 'Pune', country: 'India' },
    isApproved: true, isActive: true, isFeatured: true, views: 310, sold: 0,
  },
  {
    vendor: sellerId, title: 'Royal Enfield Meteor 350 – 2022 Model',
    description: 'Single owner, 8500 km driven. All service records. No accidents. Selling due to upgrade.',
    price: 155000, originalPrice: 195000, category: 'Vehicles',
    condition: 'good', stock: 1, isNegotiable: true, images: [],
    tags: ['royal enfield','meteor','bike','motorcycle'],
    location: { city: 'Delhi', country: 'India' },
    isApproved: true, isActive: true, isFeatured: true, views: 230, sold: 0,
  },
  {
    vendor: sellerId, title: 'Nike Air Max 270 – Size 9 (US)',
    description: 'Brand new, wrong size purchased. Never worn. Original box included.',
    price: 4999, originalPrice: 9995, category: 'Fashion',
    condition: 'new', stock: 1, isNegotiable: false, images: [],
    tags: ['nike','shoes','sneakers','airmax'],
    location: { city: 'Chennai', country: 'India' },
    isApproved: true, isActive: true, isFeatured: false, views: 73, sold: 0,
  },
  {
    vendor: sellerId, title: 'IKEA Kallax Shelf Unit – White 2x4',
    description: 'Good condition with minor scuffs on back (not visible). Easy to transport when disassembled.',
    price: 3500, originalPrice: 6999, category: 'Furniture',
    condition: 'good', stock: 1, isNegotiable: false, images: [],
    tags: ['ikea','shelf','furniture','storage'],
    location: { city: 'Hyderabad', country: 'India' },
    isApproved: true, isActive: true, isFeatured: false, views: 54, sold: 0,
  },
];

async function seed() {
  console.log('\n🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  // Remove old demo data
  const demoEmails = USERS.map(u => u.email);
  const existing   = await User.find({ email: { $in: demoEmails } });
  if (existing.length) {
    await Product.deleteMany({ vendor: { $in: existing.map(u => u._id) } });
    await User.deleteMany({ _id: { $in: existing.map(u => u._id) } });
    console.log('🗑️  Cleared old demo data');
  }

  // Create users (password hashed by pre-save hook)
  const created = {};
  for (const u of USERS) {
    const doc = await User.create({ name: u.name, email: u.email, password: u.password, role: u.role, isActive: true, isBlocked: false });
    created[u.role] = doc;
  }
  console.log('👥 Demo users created');

  // Create products linked to seller
  const products = makeProducts(created['vendor']._id);
  const inserted = await Product.insertMany(products);
  console.log(`📦 ${inserted.length} demo products created\n`);

  // Print credentials
  console.log('━'.repeat(52));
  console.log('🎉  SEED COMPLETE — Demo Login Credentials');
  console.log('━'.repeat(52));
  USERS.forEach((u, i) => {
    const icons = ['🔴','🟠','🟢'];
    console.log(`\n${icons[i]} ${u.role.toUpperCase()}:`);
    console.log(`   email:    ${u.email}`);
    console.log(`   password: ${u.password}`);
  });
  console.log('\n' + '━'.repeat(52));
  console.log(`\n✅ ${inserted.length} products now visible on homepage`);
  console.log('🚀 Start backend: npm run dev\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
