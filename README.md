# 24HxChange — Multi-Vendor Marketplace

Full-stack MERN marketplace with React + Node.js + MongoDB.

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend-part
npm install
npm run seed        # Creates demo users + products
npm run dev         # Starts on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend-part
npm install
npm run dev         # Starts on http://localhost:5173
```

---

## 🔑 Demo Login Credentials
| Role   | Email                        | Password   |
|--------|------------------------------|------------|
| Admin  | admin@24hxchange.com         | Admin@123  |
| Seller | seller@24hxchange.com        | Seller@123 |
| Buyer  | buyer@24hxchange.com         | Buyer@123  |

---

## 🖼️ Image Display — How It Works

Images are stored in `backend-part/uploads/` and served at:
```
http://localhost:5000/uploads/filename.jpg
```

The frontend `imgUrl()` helper in `src/api.js` converts any stored path to a full URL.

**Vite proxies `/uploads` to the backend** (configured in `vite.config.js`), so images work with relative paths too.

---

## ✨ Features

### Buyer
- Browse & search with filters (category, price, condition, sort)
- Product detail page with image gallery
- 🛒 **Order Now** — full order modal with shipping + payment
- 💬 **Chat with Seller** — real-time style messaging
- 📩 **Make Offer** — send offer price via chat (on negotiable items)
- ❤️ Wishlist, ⭐ Reviews, 📦 Order history with product images

### Vendor
- Add / Edit / Delete products (up to 5 images)
- Vendor Dashboard: stats, bar charts, product list, incoming orders
- Update order status (confirmed → shipped → delivered)
- View & respond to offers (Accept / Reject / Counter)

### Admin
- Dashboard with platform stats & charts
- Approve / Reject pending products
- Block / Unblock users, Change roles
- View all orders

---

## 🛠 Tech Stack
| Layer    | Technology |
|----------|------------|
| Frontend | React 18, Vite, Tailwind CSS 3, Recharts |
| Backend  | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth     | JWT + bcryptjs |
| Upload   | Multer (local disk) |
| Security | Helmet, CORS, express-rate-limit |

---

## 📡 API Endpoints
```
POST /api/auth/register     — Register
POST /api/auth/login        — Login
GET  /api/auth/me           — Current user

GET  /api/products          — List products
GET  /api/products/:id      — Product detail
POST /api/products          — Create (vendor)
PUT  /api/products/:id      — Edit (owner/admin)
DELETE /api/products/:id    — Delete

POST /api/orders            — Place order
GET  /api/orders/my         — Buyer's orders
GET  /api/orders/vendor     — Vendor's orders
PUT  /api/orders/:id/status — Update status

POST /api/vendors/apply     — Become vendor
GET  /api/vendors/products  — My products
GET  /api/vendors/stats     — Dashboard stats

POST /api/offers            — Make offer
GET  /api/offers/seller     — Seller's offers
PUT  /api/offers/:id        — Accept/Reject/Counter

GET  /api/admin/stats       — Platform stats
GET  /api/admin/users       — All users
GET  /api/admin/orders      — All orders

POST /api/chat              — Start/get chat
POST /api/chat/:id/messages — Send message

GET  /api/debug/uploads     — List uploaded files (dev only)
```
