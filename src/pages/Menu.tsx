import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ShoppingBag, Plus, Minus, X, ArrowLeft, Search, Flame } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, type Category, type MenuItem, type CartItem } from '@/lib/types';
import { formatETB, classNames } from '@/lib/utils';
import { LogoLockup } from '@/components/Logo';

export default function Menu() {
  const navigate = useNavigate();
  const { branch, cart, cartCount, cartTotal, addToCart, updateQty, clearCart } = useShop();
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [activeCat, setActiveCat] = useState<Category>('burgers');
  const [query, setQuery] = useState('');
  const [drawerItem, setDrawerItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branch) {
      navigate('/');
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('sort_order', { ascending: true });
      if (error) {
        setError('Could not load menu. Check your connection.');
        return;
      }
      setItems(data as MenuItem[]);
    })();
  }, [branch, navigate]);

  const filtered = useMemo(() => {
    if (!items) return [];
    let list = items;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    } else {
      list = list.filter((i) => i.category === activeCat);
    }
    return list;
  }, [items, activeCat, query]);

  const specials = useMemo(() => (items ?? []).filter((i) => i.is_special), [items]);

  if (!branch) return null;

  return (
    <div className="min-h-screen bg-charcoal-50 pb-28">
      {/* header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-charcoal-100 pt-safe">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between">
            <LogoLockup />
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs font-medium text-charcoal-600 bg-charcoal-50 px-3 py-1.5 rounded-full"
            >
              <MapPin className="w-3.5 h-3.5 text-salt-500" />
              <span className="max-w-[140px] truncate">{branch.name}</span>
            </button>
          </div>

          {/* search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-charcoal-50 text-sm placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-salt-400"
            />
          </div>

          {/* category tabs */}
          {!query && (
            <div className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveCat(c.key)}
                  className={classNames(
                    'shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                    activeCat === c.key
                      ? 'bg-salt-500 text-white shadow-pop'
                      : 'bg-white text-charcoal-600 border border-charcoal-100'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* specials banner */}
      {!query && specials.length > 0 && activeCat !== 'specials' && (
        <button
          onClick={() => setActiveCat('specials')}
          className="mx-4 mt-4 w-[calc(100%-2rem)] flex items-center gap-3 rounded-2xl bg-gradient-to-r from-salt-500 to-salt-600 text-white p-4 text-left shadow-pop active:scale-[0.99] transition-transform"
        >
          <Flame className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">New Specials &amp; Discounts</p>
            <p className="text-xs text-white/80">{specials.length} limited-time deals live now</p>
          </div>
          <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">View</span>
        </button>
      )}

      {/* content */}
      <div className="px-4 mt-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {items === null && !error && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl skeleton" />
            ))}
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setDrawerItem(item)}
              className="w-full text-left flex gap-3 rounded-2xl bg-white p-3 shadow-card hover:shadow-pop transition-all active:scale-[0.99]"
            >
              <div className="w-20 h-20 rounded-xl bg-charcoal-50 overflow-hidden shrink-0 flex items-center justify-center">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <LogoLockup className="opacity-30 scale-75" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-charcoal-900 leading-tight">{item.name}</p>
                  {item.is_special && (
                    <span className="shrink-0 text-[10px] font-bold text-salt-600 bg-salt-50 px-2 py-0.5 rounded-full">
                      SPECIAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-charcoal-400 mt-1 line-clamp-2">{item.description}</p>
                <p className="mt-auto font-bold text-salt-600">{formatETB(item.price)}</p>
              </div>
            </button>
          ))}
          {items !== null && filtered.length === 0 && !error && (
            <p className="text-center text-charcoal-400 text-sm py-12">No items found.</p>
          )}
        </div>
      </div>

      {/* floating cart bar */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md flex items-center justify-between bg-charcoal-900 text-white px-5 py-3.5 rounded-2xl shadow-pop active:scale-[0.99] transition-transform z-40"
        >
          <span className="flex items-center gap-2 font-semibold">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-salt-500 text-xs font-bold">{cartCount}</span>
            View cart
          </span>
          <span className="font-bold">{formatETB(cartTotal)}</span>
        </button>
      )}

      {/* item customization drawer */}
      {drawerItem && (
        <ItemDrawer
          item={drawerItem}
          onClose={() => setDrawerItem(null)}
          onAdd={(ci) => { addToCart(ci); setDrawerItem(null); setCartOpen(true); }}
        />
      )}

      {/* cart drawer */}
      {cartOpen && (
        <CartDrawer
          onClose={() => setCartOpen(false)}
          onCheckout={() => { setCartOpen(false); navigate('/checkout'); }}
          cart={cart}
          total={cartTotal}
          updateQty={updateQty}
          clearCart={clearCart}
          branchName={branch.name}
        />
      )}
    </div>
  );
}

function ItemDrawer({ item, onClose, onAdd }: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (ci: CartItem) => void;
}) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const extras = ['Extra cheese', 'No onions', 'Spicy', 'Extra sauce'];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display text-xl font-bold">{item.name}</h3>
          <button onClick={onClose} className="p-1 -mr-1 text-charcoal-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="w-full h-40 rounded-2xl bg-charcoal-50 overflow-hidden mb-4 flex items-center justify-center">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <LogoLockup className="opacity-30" />
          )}
        </div>
        <p className="text-sm text-charcoal-500 mb-4">{item.description}</p>

        <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2">Preferences</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {extras.map((e) => (
            <label key={e} className="flex items-center gap-1.5 text-sm bg-charcoal-50 px-3 py-1.5 rounded-full cursor-pointer">
              <input type="checkbox" className="accent-salt-500" />
              {e}
            </label>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special instructions (optional)"
          className="w-full text-sm rounded-xl border border-charcoal-100 p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-salt-400"
          rows={2}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-full bg-charcoal-50 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
            <span className="font-bold w-6 text-center">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="w-9 h-9 rounded-full bg-salt-500 text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
          </div>
          <button
            onClick={() => onAdd({ id: item.id, name: item.name, price: item.price, qty, notes: notes || undefined })}
            className="flex-1 ml-4 bg-salt-500 text-white font-bold py-3 rounded-xl shadow-pop active:scale-[0.98] transition-transform"
          >
            Add · {formatETB(item.price * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ onClose, onCheckout, cart, total, updateQty, clearCart, branchName }: {
  onClose: () => void;
  onCheckout: () => void;
  cart: CartItem[];
  total: number;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  branchName: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl flex flex-col animate-slide-up max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-charcoal-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-salt-500" />
            <h3 className="font-display text-lg font-bold">Your cart</h3>
          </div>
          <button onClick={onClose} className="p-1 -mr-1 text-charcoal-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-2 text-xs text-charcoal-400 flex items-center gap-1 border-b border-charcoal-50">
          <MapPin className="w-3.5 h-3.5 text-salt-500" /> Pickup at <span className="font-semibold text-charcoal-700">{branchName}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 && (
            <p className="text-center text-charcoal-400 text-sm py-10">Your cart is empty.</p>
          )}
          {cart.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.name}</p>
                {c.notes && <p className="text-xs text-charcoal-400 truncate">{c.notes}</p>}
                <p className="text-sm text-salt-600 font-semibold">{formatETB(c.price * c.qty)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(c.id, c.qty - 1)} className="w-8 h-8 rounded-full bg-charcoal-50 flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                <span className="font-semibold text-sm w-5 text-center">{c.qty}</span>
                <button onClick={() => updateQty(c.id, c.qty + 1)} className="w-8 h-8 rounded-full bg-charcoal-50 flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="p-5 border-t border-charcoal-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-charcoal-500">Subtotal</span>
              <span className="font-bold">{formatETB(total)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-salt-500 text-white font-bold py-3.5 rounded-xl shadow-pop active:scale-[0.98] transition-transform"
            >
              Checkout · {formatETB(total)}
            </button>
            <button onClick={clearCart} className="w-full text-xs text-charcoal-400 py-1">Clear cart</button>
          </div>
        )}
      </div>
    </div>
  );
}
