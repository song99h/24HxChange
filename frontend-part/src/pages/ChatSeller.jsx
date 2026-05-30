import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  getMyChatsApi, getChatMsgsApi,
  sendMessageWithImageApi, reactToMessageApi, deleteMessageApi,
  deleteChatApi,
  imgUrl,
} from '../api';
import { useAuth } from '../context/AuthContext';


// ─── Product Strip ────────────────────────────────────────────────────────────
const ProductStrip = ({ product }) => {
  const [iErr, setIErr] = useState(false);

  if (!product) return null;

  const src = product.image && !iErr ? imgUrl(product.image) : '';

  return (
    <div className="mx-4 mb-3 bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 flex items-center gap-3">
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-200 shrink-0">
        {src ? (
          <img
            src={src}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={() => setIErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl text-gray-400">
            📦
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">
          {product.title}
        </p>
        <p className="text-xs font-bold text-indigo-600">
          ₹{Number(product.price).toLocaleString('en-IN')}
        </p>
      </div>

      {product._id && (
        <a
          href={`/product/${product._id}`}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition shrink-0"
        >
          View →
        </a>
      )}
    </div>
  );
};

// ─── Emoji data ───────────────────────────────────────────────────────────────
const EMOJI_CATS = {
  '😀': ['😀','😂','🥲','😊','😍','🥰','😎','🤩','😜','🤔','😮','😢','😡','🥺','😴','🤗','😏','🙄','🥳','😇','😆','😅','🤣','😉','😌','😔','😟','😳','🤯','😱'],
  '👍': ['👍','👎','👋','🤝','🙌','👏','✌️','🤞','🫶','❤️','🔥','💯','✅','❌','💪','🎉','🎊','💥','⚡','🌟','💫','✨','🎯','🏆','👑','💎','🚀','💡','📌','🔑'],
  '🐶': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦋','🐝','🐞','🐠','🐬','🐳','🦄','🦓','🦒','🐘'],
  '🍕': ['🍕','🍔','🌮','🍜','🍣','🍦','🎂','☕','🧋','🍺','🥤','🍿','🧁','🍩','🍪','🥪','🥗','🍱','🍛','🥘','🍲','🥙','🌯','🧆','🥚','🧀','🥓','🍗','🥩','🥞'],
  '⚽': ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🎿','🛹','🏄','🤾','🧗','🚴','🏋️','🤸','🏊','🚵','🏇','⛷️','🤺','🥅','🎣','🤿','🧘','🏌️','🥌'],
  '🚀': ['🚀','💻','📱','🎮','🎵','🎨','📷','🔑','💡','📚','🔭','🧪','🎯','🎲','🎭','🎬','📺','🖥️','⌚','🧳','🎸','🎹','🎺','🥁','🎤','🎧','📡','🔬','💊','🧬'],
};
const ALL_EMOJI = Object.values(EMOJI_CATS).flat();
const QUICK_REACT = ['👍','❤️','😂','😮','😢','🔥'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (d) => d
  ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  : '';

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const now = new Date();
  if (dt.toDateString() === now.toDateString()) return 'Today';
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (dt.toDateString() === yest.toDateString()) return 'Yesterday';
  return dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const groupByDate = (msgs) => {
  const out = [];
  let last = '';
  for (const m of msgs) {
    const d = fmtDate(m.createdAt);
    if (d !== last) { out.push({ type: 'date', label: d }); last = d; }
    out.push({ type: 'msg', msg: m });
  }
  return out;
};

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
const EmojiPicker = ({ onSelect, onClose }) => {
  const [q, setQ]     = useState('');
  const [tab, setTab] = useState(Object.keys(EMOJI_CATS)[0]);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [onClose]);

  const list = q ? ALL_EMOJI.filter(e => e.includes(q)) : EMOJI_CATS[tab];

  return (
    <div ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100"
      style={{ width: 300, maxHeight: 340 }}>
      <div className="p-2 border-b border-gray-100">
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search emoji…"
          className="w-full px-3 py-1.5 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      {!q && (
        <div className="flex gap-0.5 px-2 py-1 border-b border-gray-100 overflow-x-auto">
          {Object.keys(EMOJI_CATS).map(c => (
            <button key={c} onClick={() => setTab(c)} title={c}
              className={`shrink-0 px-2 py-1 rounded-lg text-base transition ${tab === c ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}>
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-8 gap-0.5 p-2 overflow-y-auto" style={{ maxHeight: 220 }}>
        {(list || []).map((e, i) => (
          <button key={i} onClick={() => onSelect(e)}
            className="w-8 h-8 flex items-center justify-center text-xl rounded-lg hover:bg-indigo-50 transition">
            {e}
          </button>
        ))}
        {!list?.length && <p className="col-span-8 text-center text-xs text-gray-400 py-4">Nothing found</p>}
      </div>
    </div>
  );
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox = ({ src, onClose }) => (
  <div className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-4" onClick={onClose}>
    <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
      <img src={src} alt="preview" className="max-h-[85vh] w-full object-contain rounded-2xl shadow-2xl" />
      <button onClick={onClose}
        className="absolute top-3 right-3 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full text-white flex items-center justify-center text-lg transition">
        ✕
      </button>
    </div>
  </div>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
// Displays the user's profile image if available, else a gradient initial circle.
// Works with both `avatar` field (populated chat participants) and `image` field (auth user).
// The `size` prop controls dimensions: 'sm' = 32px, 'lg' = 40px, 'xl' = 56px.
const Avatar = ({ u, size = 'sm' }) => {
  const [err, setErr] = useState(false);

  // Support both field names: populated participants use `avatar`, auth user uses `image`
  const rawSrc = u?.avatar || u?.image || '';
  const src = rawSrc && !err ? imgUrl(rawSrc) : '';

  const cls =
    size === 'xl' ? 'w-14 h-14 text-lg' :
    size === 'lg' ? 'w-10 h-10 text-sm' :
                    'w-8 h-8 text-xs';

  const initial = (u?.name || '?')[0].toUpperCase();

  return src ? (
    <img
      src={src}
      alt={u?.name || 'User'}
      onError={() => setErr(true)}
      className={`${cls} rounded-full object-cover shrink-0 ring-2 ring-white shadow`}
    />
  ) : (
    <div className={`${cls} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-white shadow`}>
      {initial}
    </div>
  );
};

// ─── BubbleAvatar ─────────────────────────────────────────────────────────────
// Compact avatar variant sized for message bubbles (28×28 px).
// Uses same image-then-fallback logic as Avatar but fits the tighter bubble layout.
const BubbleAvatar = ({ u }) => {
  const [err, setErr] = useState(false);

  const rawSrc = u?.avatar || u?.image || '';
  const src = rawSrc && !err ? imgUrl(rawSrc) : '';

  const initial = (u?.name || '?')[0].toUpperCase();

  return src ? (
    <img
      src={src}
      alt={u?.name || 'User'}
      onError={() => setErr(true)}
      className="w-7 h-7 rounded-full object-cover shrink-0 ring-2 ring-white shadow"
    />
  ) : (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white shadow">
      {initial}
    </div>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
// `mine`      → message sent by the logged-in user (aligns right)
// `otherUser` → the OTHER participant object (has .name + .avatar/.image)
// `myUser`    → the logged-in user object (has .name + .avatar/.image)
// Whichever is the sender for a given message gets their avatar shown.
const Bubble = ({ msg, mine, otherUser, myUser, myId, onReact, onReply, onDelete, onImg }) => {
  const [hover, setHover] = useState(false);

  if (msg.deleted) return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-1`}>
      <span className="text-xs text-gray-400 italic px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">🚫 Deleted</span>
    </div>
  );

  const isOffer = msg.messageType === 'offer';
  const hasImg  = !!msg.image;
  const hasTxt  = !!msg.content;

  // Determine which user object to show as the avatar for this message.
  // If it's my message → show myUser; otherwise → show otherUser.
  const senderUser = mine ? myUser : otherUser;

  // Group reactions
  const rxGroups = {};
  for (const r of msg.reactions || []) {
    rxGroups[r.emoji] = rxGroups[r.emoji] || { emoji: r.emoji, count: 0, mine: false };
    rxGroups[r.emoji].count++;
    const uid = (r.user?._id || r.user)?.toString();
    if (uid === myId) rxGroups[r.emoji].mine = true;
  }

  return (
    <div
      className={`flex items-end gap-2 mb-1 group relative ${mine ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >

      {/* ── Avatar: shown on the outer edge of each bubble ── */}
      <div className="shrink-0 mb-1">
        <BubbleAvatar u={senderUser} />
      </div>

      {/* ── Bubble body ── */}
      <div className={`flex flex-col max-w-xs lg:max-w-md ${mine ? 'items-end' : 'items-start'}`}>

        {/* Reply preview */}
        {msg.replySnap && (
          <div className={`text-xs px-3 py-1 rounded-t-xl border-l-4 mb-0.5 max-w-full truncate ${
            mine
              ? 'bg-indigo-500/20 border-indigo-300 text-indigo-100'
              : 'bg-gray-100 border-gray-300 text-gray-500'
          }`}>
            <span className="font-semibold">{msg.replySnap.sender}: </span>
            {msg.replySnap.content || '📷 Image'}
          </div>
        )}

        {/* Main bubble */}
        <div className={`relative px-3.5 py-2.5 shadow-sm text-sm ${
          mine ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
        } ${
          isOffer
            ? mine
              ? 'bg-amber-500 text-white'
              : 'bg-amber-50 border border-amber-200 text-amber-900'
            : mine
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-800 border border-gray-100'
        }`}>
          {isOffer && (
            <p className={`text-xs font-bold mb-1 ${mine ? 'text-amber-100' : 'text-amber-600'}`}>
              📩 Offer — ₹{Number(msg.offerPrice || 0).toLocaleString('en-IN')}
            </p>
          )}

          {hasImg && (
            <div className="mb-1 -mx-0.5">
              <img
                src={imgUrl(msg.image)}
                alt="img"
                className="rounded-xl max-w-[220px] max-h-[220px] object-cover cursor-zoom-in hover:opacity-90 transition"
                onClick={() => onImg(imgUrl(msg.image))}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          {hasTxt && (
            <p className="break-words whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          )}

          <p className={`text-[10px] mt-1 ${mine ? 'text-right text-indigo-200' : 'text-right text-gray-400'}`}>
            {fmtTime(msg.createdAt)}
            {mine && <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>}
          </p>
        </div>

        {/* Reaction pills */}
        {Object.keys(rxGroups).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${mine ? 'justify-end' : 'justify-start'}`}>
            {Object.values(rxGroups).map(rg => (
              <button
                key={rg.emoji}
                onClick={() => onReact(msg._id, rg.emoji)}
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition ${
                  rg.mine
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {rg.emoji}{rg.count > 1 && <span className="ml-0.5">{rg.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action bar on hover */}
      {hover && (
        <div className={`absolute ${mine ? 'right-full mr-2' : 'left-full ml-2'} top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-20`}>
          <div className="flex items-center gap-0.5 bg-white rounded-full shadow-lg border border-gray-100 px-1.5 py-1">
            {QUICK_REACT.map(e => (
              <button
                key={e}
                onClick={() => onReact(msg._id, e)}
                className="w-6 h-6 flex items-center justify-center text-base hover:scale-125 transition-transform rounded-full"
              >
                {e}
              </button>
            ))}
          </div>
          <button
            onClick={() => onReply(msg)}
            title="Reply"
            className="w-7 h-7 bg-white rounded-full shadow border border-gray-100 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition text-sm flex items-center justify-center"
          >
            ↩
          </button>
          {mine && (
            <button
              onClick={() => onDelete(msg._id)}
              title="Delete"
              className="w-7 h-7 bg-white rounded-full shadow border border-gray-100 text-gray-500 hover:text-red-500 hover:border-red-200 transition text-sm flex items-center justify-center"
            >
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ChatSeller = () => {
  const { user } = useAuth();
  const location = useLocation();
  const prefill  = location.state?.prefill || '';

  const [chats, setChats]           = useState([]);
  const [active, setActive]         = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState(prefill);
  const [loading, setLoading]       = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending]       = useState(false);
  const [err, setErr]               = useState('');
  const [search, setSearch]         = useState('');
  const [lightbox, setLightbox]     = useState(null);
  const [showEmoji, setShowEmoji]   = useState(false);
  const [imgFile, setImgFile]       = useState(null);
  const [imgPrev, setImgPrev]       = useState(null);
  const [replyTo, setReplyTo]       = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // chatId to confirm delete

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fileRef   = useRef(null);
  const activeRef = useRef(null);

  // ── Load chats ──
  useEffect(() => {
    getMyChatsApi()
      .then(d => {
        const c = d.chats || [];
        setChats(c);
        if (prefill && c.length > 0) openChat(c[0]);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Keep activeRef in sync for polling ──
  useEffect(() => { activeRef.current = active; }, [active]);

  // ── Poll every 5 s for new messages ──
  useEffect(() => {
    const id = setInterval(async () => {
      const cur = activeRef.current;
      if (!cur) return;
      try {
        const d = await getChatMsgsApi(cur._id);
        setMessages(d.chat?.messages || []);
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // ── Derived helpers ──

  // Returns the OTHER participant in a chat (not the logged-in user).
  const getOther = useCallback((c) =>
    c?.participants?.find(p => (p._id || p)?.toString() !== user?._id?.toString()) || {},
  [user]);

  // Returns true if the message was sent by the current user.
  const isMyMsg = useCallback((m) =>
    (m.sender?._id || m.sender)?.toString() === user?._id?.toString(),
  [user]);

  // Normalises the product preview object from a chat.
  const getProduct = (c) => {
    if (!c) return null;
    const s = c.productSnapshot, p = c.product;
    if (!s && !p) return null;
    return {
      title: s?.title || p?.title || '',
      image: s?.image || p?.images?.[0] || '',
      price: s?.price || p?.price || 0,
      _id:   p?._id || '',
    };
  };

  // ── Filtered sidebar list ──
  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter(c =>
      getOther(c)?.name?.toLowerCase().includes(q) ||
      getProduct(c)?.title?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  }, [chats, search, getOther]);

  // ── Open a chat conversation ──
  const openChat = useCallback(async (chat) => {
    setActive(chat);
    setMsgLoading(true);
    setMessages([]);
    setReplyTo(null);
    setImgFile(null);
    setImgPrev(null);
    try {
      const d = await getChatMsgsApi(chat._id);
      setMessages(d.chat?.messages || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setMsgLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, []);

  // ── Send message ──
  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!input.trim() && !imgFile) || !active || sending) return;
    const txt = input.trim();
    setInput(''); setImgFile(null); setImgPrev(null); setReplyTo(null); setShowEmoji(false);
    setSending(true);
    try {
      const fd = new FormData();
      if (txt)     fd.append('content', txt);
      if (imgFile) fd.append('image', imgFile);
      if (replyTo) {
        fd.append('replyTo', replyTo._id);
        fd.append('replySnap', JSON.stringify({
          content: replyTo.content || '',
          sender:  replyTo.sender?.name || 'Unknown',
        }));
      }
      const d = await sendMessageWithImageApi(active._id, fd);
      setMessages(p => [...p, d.message]);
      setChats(p => p.map(c =>
        c._id === active._id
          ? { ...c, lastMessage: imgFile ? '📷 Image' : txt, lastActivity: new Date() }
          : c
      ));
    } catch (e) {
      setErr(e.message);
      setInput(txt);
    } finally {
      setSending(false);
    }
  };

  // ── Insert emoji at cursor position ──
  const addEmoji = (emoji) => {
    const el  = inputRef.current;
    const pos = el?.selectionStart ?? input.length;
    setInput(p => p.slice(0, pos) + emoji + p.slice(pos));
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(pos + emoji.length, pos + emoji.length);
    }, 0);
  };

  // ── Pick image file ──
  const pickImg = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr('Max image size is 5 MB'); return; }
    setImgFile(f);
    setImgPrev(URL.createObjectURL(f));
    e.target.value = '';
  };

  // ── React to a message ──
  const handleReact = async (msgId, emoji) => {
    try {
      const d = await reactToMessageApi(active._id, msgId, { emoji });
      setMessages(p => p.map(m => m._id === msgId ? { ...m, reactions: d.reactions } : m));
    } catch (e) { setErr(e.message); }
  };

  // ── Delete entire chat conversation ──
  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChatApi(chatId);
      setChats(p => p.filter(c => c._id !== chatId));
      if (active?._id === chatId) {
        setActive(null);
        setMessages([]);
      }
      setDeleteConfirm(null);
    } catch (e) { setErr(e.message); }
  };

  // ── Delete a message ──
  const handleDelete = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteMessageApi(active._id, msgId);
      setMessages(p => p.map(m =>
        m._id === msgId ? { ...m, deleted: true, content: '', image: '' } : m
      ));
    } catch (e) { setErr(e.message); }
  };

  // ── Enter to send, Shift+Enter for newline ──
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Date-grouped message list ──
  const grouped = useMemo(() => groupByDate(messages), [messages]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-3 py-5">

      {/* Error toast */}
      {err && (
        <div className="fixed top-5 right-5 z-[100] bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm">
          <span className="text-sm flex-1">{err}</span>
          <button onClick={() => setErr('')} className="text-white/70 hover:text-white text-lg">✕</button>
        </div>
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      {/* Delete chat confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🗑️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Conversation?</h3>
              <p className="text-sm text-gray-500 mb-6">This will permanently delete all messages in this conversation. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition text-sm">Cancel</button>
                <button onClick={() => handleDeleteChat(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold transition text-sm">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Title bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
          💬
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Messages</h1>
          <p className="text-sm text-gray-400">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Chat shell */}
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex"
        style={{ height: 'calc(100vh - 170px)', minHeight: 540 }}
      >

        {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
        <div className="w-72 border-r border-gray-100 flex flex-col shrink-0 bg-slate-50/60">

          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-7 h-7 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-4 text-gray-400">
                <p className="text-4xl mb-2">💬</p>
                <p className="text-sm font-medium">{search ? 'No results' : 'No conversations'}</p>
                <p className="text-xs mt-1 text-gray-300">
                  {search ? 'Try different keywords' : 'Open a product to start chatting'}
                </p>
              </div>
            ) : filtered.map(chat => {
              const other   = getOther(chat);
              const product = getProduct(chat);
              const isAct   = active?._id === chat._id;
              const unread  = chat.unread || 0;
              return (
                <div key={chat._id} className="relative group/item">
                  <button
                    onClick={() => openChat(chat)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all border-b border-gray-50 hover:bg-indigo-50/60 border-l-4 ${
                      isAct ? 'bg-indigo-50 border-l-indigo-500' : 'border-l-transparent'
                    }`}
                  >
                  <div className="relative shrink-0">
                    {/* Sidebar avatar — uses Avatar (32px) with image-then-initial fallback */}
                    <Avatar u={other} size="sm" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold truncate ${isAct ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {other?.name || 'Unknown'}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-1">{fmtDate(chat.lastActivity)}</span>
                    </div>
                    {product?.title && (
                      <p className="text-[11px] text-indigo-500 truncate">📦 {product.title}</p>
                    )}
                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
                      {chat.lastMessage || 'Start the conversation…'}
                    </p>
                  </div>
                  </button>
                  {/* Delete chat button - appears on hover */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(chat._id); }}
                    title="Delete conversation"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition text-sm opacity-0 group-hover/item:opacity-100"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CHAT WINDOW ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {!active ? (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/20">
              <div className="text-center select-none">
                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">💬</div>
                <h3 className="text-lg font-semibold text-gray-700">Pick a conversation</h3>
                <p className="text-sm text-gray-400 mt-1">Or go to a product page to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="border-b border-gray-100 bg-white shadow-sm shrink-0">
                <div className="px-4 py-3 flex items-center gap-3">
                  {/* Header avatar: larger (40px) version of the other user */}
                  <Avatar u={getOther(active)} size="lg" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{getOther(active)?.name || 'Unknown'}</p>
                    <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Active
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(active._id)}
                    title="Delete conversation"
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition text-base shrink-0"
                  >
                    🗑️
                  </button>
                </div>
                <ProductStrip product={getProduct(active)} />
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-slate-50/60 to-white">
                {msgLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="text-center pt-14 text-gray-400 select-none">
                    <p className="text-3xl mb-2">👋</p>
                    <p className="font-medium">No messages yet</p>
                    <p className="text-sm mt-1">Say hello!</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {grouped.map((item, i) => {
                      if (item.type === 'date') return (
                        <div key={`d${i}`} className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="text-xs text-gray-400 font-medium bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            {item.label}
                          </span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      );

                      const m = item.msg;
                      const mine = isMyMsg(m);

                      return (
                        <Bubble
                          key={m._id || i}
                          msg={m}
                          mine={mine}
                          // Pass the full user objects so BubbleAvatar can read avatar/image
                          otherUser={getOther(active)}
                          myUser={user}
                          myId={user?._id?.toString()}
                          onReact={handleReact}
                          onReply={m => { setReplyTo(m); inputRef.current?.focus(); }}
                          onDelete={handleDelete}
                          onImg={setLightbox}
                        />
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Reply banner */}
              {replyTo && (
                <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center gap-3 shrink-0">
                  <div className="flex-1 border-l-4 border-indigo-400 pl-3 min-w-0">
                    <p className="text-xs font-semibold text-indigo-600">
                      ↩ Replying to {replyTo.sender?.name || 'message'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {replyTo.content || (replyTo.image ? '📷 Image' : '')}
                    </p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 text-lg shrink-0">✕</button>
                </div>
              )}

              {/* Image preview banner */}
              {imgPrev && (
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-3 shrink-0">
                  <img src={imgPrev} alt="preview" className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{imgFile?.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {imgFile ? (imgFile.size / 1024).toFixed(1) + ' KB' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => { setImgFile(null); setImgPrev(null); }}
                    className="text-red-400 hover:text-red-600 text-xl leading-none shrink-0"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input bar */}
              <div className="border-t border-gray-100 bg-white px-3 py-3 shrink-0">
                <div className="flex items-end gap-2">

                  {/* Emoji button */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowEmoji(p => !p)}
                      title="Add emoji"
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition"
                    >
                      😊
                    </button>
                    {showEmoji && <EmojiPicker onSelect={addEmoji} onClose={() => setShowEmoji(false)} />}
                  </div>

                  {/* Attach image */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    title="Attach image"
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition shrink-0"
                  >
                    📎
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImg} />

                  {/* Message textarea */}
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type a message… (Enter to send)"
                    disabled={sending}
                    rows={1}
                    style={{ maxHeight: 110, overflowY: 'auto' }}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition resize-none bg-gray-50 hover:bg-white focus:bg-white leading-relaxed disabled:opacity-60"
                  />

                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={sending || (!input.trim() && !imgFile)}
                    className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-200 text-white flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition shrink-0"
                  >
                    {sending
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                      : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    }
                  </button>
                </div>

                <p className="text-[10px] text-gray-300 mt-1.5 pl-1 select-none">
                  Enter to send · Shift+Enter for new line · 😊 emoji · 📎 image · hover a message to react or reply
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSeller;
