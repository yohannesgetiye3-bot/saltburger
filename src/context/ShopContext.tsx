import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Branch, CartItem } from '@/lib/types';

interface ShopState {
  branch: Branch | null;
  setBranch: (b: Branch | null) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const ShopContext = createContext<ShopState | null>(null);

const BRANCH_KEY = 'salt_branch_id';
const CART_KEY = 'salt_cart';

export function ShopProvider({ children }: { children: ReactNode }) {
  const [branch, setBranchState] = useState<Branch | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      if (c) setCart(JSON.parse(c));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const setBranch = (b: Branch | null) => {
    setBranchState(b);
    if (b) localStorage.setItem(BRANCH_KEY, b.id);
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id && !item.options?.length);
      if (existing && !item.options?.length) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + item.qty } : c));
      }
      return [...prev, item];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty } : c)));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const clearCart = () => setCart([]);

  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, c) => s + c.qty * c.price, 0), [cart]);

  const value: ShopState = {
    branch,
    setBranch,
    cart,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}

export { BRANCH_KEY };
