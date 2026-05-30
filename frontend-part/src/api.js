// ── Base URL config ───────────────────────────────────────────────────────────
const RAW_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_BASE = RAW_API.startsWith('http')
  ? RAW_API.replace(/\/api\/?$/, '')
  : '';

export const BASE_URL = RAW_API;

const getToken = () => localStorage.getItem('token');

const headers = (isForm = false) => {
  const h = {};
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (!isForm) h['Content-Type'] = 'application/json';
  return h;
};

const request = async (method, endpoint, body = null, isForm = false) => {
  const opts = { method, headers: headers(isForm) };
  if (body) opts.body = isForm ? body : JSON.stringify(body);
  const res  = await fetch(`${BASE_URL}${endpoint}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerApi            = (d)  => request('POST', '/auth/register', d);
export const loginApi               = (d)  => request('POST', '/auth/login',    d);
export const getMeApi               = ()   => request('GET',  '/auth/me');
export const updatePassApi          = (d)  => request('PUT',  '/auth/password', d);

// ── Products ──────────────────────────────────────────────────────────────────
export const getProductsApi   = (q = '')   => request('GET',    `/products?${q}`);
export const getProductApi    = (id)       => request('GET',    `/products/${id}`);
export const getFeaturedApi   = ()         => request('GET',    '/products/featured');
export const createProductApi = (fd)       => request('POST',   '/products', fd, true);
export const updateProductApi = (id, fd)   => request('PUT',    `/products/${id}`, fd, true);
export const deleteProductApi = (id)       => request('DELETE', `/products/${id}`);
export const addReviewApi     = (id, d)    => request('POST',   `/products/${id}/reviews`, d);

// ── Orders ────────────────────────────────────────────────────────────────────
export const placeOrderApi        = (d)     => request('POST', '/orders', d);
export const getMyOrdersApi       = ()      => request('GET',  '/orders/my');
export const getVendorOrdersApi   = ()      => request('GET',  '/orders/vendor');
export const updateOrderStatusApi = (id, d) => request('PUT',  `/orders/${id}/status`, d);
export const getOrderApi          = (id)    => request('GET',  `/orders/${id}`);

// ── Users ─────────────────────────────────────────────────────────────────────
export const updateProfileApi      = (fd)  => request('PUT',  '/users/profile',       fd, true);
export const updateProfileImageApi = (fd)  => request('PUT',  '/users/profile-image', fd, true);
export const getWishlistApi        = ()    => request('GET',  '/users/wishlist');
export const toggleWishlistApi     = (id)  => request('POST', `/users/wishlist/${id}`);
export const getVendorProfileApi   = (id)  => request('GET',  `/users/vendor/${id}`);

// ── Vendors ───────────────────────────────────────────────────────────────────
export const applyVendorApi    = ()  => request('POST', '/vendors/apply');
export const getMyProductsApi  = ()  => request('GET',  '/vendors/products');
export const getVendorStatsApi = ()  => request('GET',  '/vendors/stats');

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminStatsApi      = ()       => request('GET',   '/admin/stats');
export const getAllUsersApi         = (q = '') => request('GET',   `/admin/users?${q}`);
export const toggleBlockUserApi    = (id)     => request('PATCH', `/admin/users/${id}/block`);
export const changeUserRoleApi     = (id, d)  => request('PATCH', `/admin/users/${id}/role`, d);
export const getPendingProductsApi = ()       => request('GET',   '/admin/products/pending');
export const approveProductApi     = (id, d)  => request('PATCH', `/admin/products/${id}/approve`, d);
export const toggleFeaturedApi     = (id)     => request('PATCH', `/admin/products/${id}/featured`);
export const getAllOrdersApi        = (q = '') => request('GET',   `/admin/orders?${q}`);

// ── Chat ──────────────────────────────────────────────────────────────────────
export const getMyChatsApi      = ()      => request('GET',  '/chat');
export const getOrCreateChatApi = (d)     => request('POST', '/chat', d);
export const getChatMsgsApi     = (id)    => request('GET',  `/chat/${id}`);
export const sendMessageApi     = (id, d) => request('POST', `/chat/${id}/messages`, d);

// ── Offers ────────────────────────────────────────────────────────────────────
export const createOfferApi          = (d)     => request('POST',   '/offers', d);
export const getSellerOffersApi      = ()      => request('GET',    '/offers/seller');
export const getBuyerOffersApi       = ()      => request('GET',    '/offers/buyer');
export const respondToOfferApi       = (id, d) => request('PUT',    `/offers/${id}`, d);
export const createOrderFromOfferApi = (id, d) => request('POST',   `/offers/${id}/order`, d);
export const deleteOfferApi          = (id)    => request('DELETE', `/offers/${id}`);

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategoriesApi = () => request('GET', '/categories');

// ── imgUrl: universal image URL builder ───────────────────────────────────────
export const imgUrl = (src) => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('blob:')) return src;
  const p = src.startsWith('/') ? src : `/${src}`;
  return `${API_BASE}${p}`;
};

// ── Chat (extended) ───────────────────────────────────────────────────────────
export const sendMessageWithImageApi = (chatId, formData) =>
  request('POST', `/chat/${chatId}/messages`, formData, true);
export const reactToMessageApi  = (chatId, msgId, d) =>
  request('POST', `/chat/${chatId}/messages/${msgId}/react`, d);
export const deleteMessageApi   = (chatId, msgId) =>
  request('DELETE', `/chat/${chatId}/messages/${msgId}`);
export const deleteChatApi      = (chatId) =>
  request('DELETE', `/chat/${chatId}`);
