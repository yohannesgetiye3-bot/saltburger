export type Category = 'burgers' | 'combos' | 'sides' | 'drinks' | 'specials';

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'burgers', label: 'Burgers' },
  { key: 'combos', label: 'Combos' },
  { key: 'sides', label: 'Sides' },
  { key: 'drinks', label: 'Drinks' },
  { key: 'specials', label: 'Specials' },
];

export interface Branch {
  id: string;
  name: string;
  short_code: string;
  address: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  is_special: boolean;
  sort_order: number;
}

export interface CartItem {
  id: string; // menu item id
  name: string;
  price: number;
  qty: number;
  options?: string[];
  notes?: string;
}

export type OrderStatus = 'pending' | 'paid' | 'completed';
export type PaymentMethod = 'cash' | 'telebirr' | 'cbe' | 'awash';

export const PAYMENT_METHODS: { key: PaymentMethod; label: string; hint: string }[] = [
  { key: 'cash', label: 'Cash on Pickup', hint: 'Pay at the counter' },
  { key: 'telebirr', label: 'Telebirr', hint: 'Mobile transfer' },
  { key: 'cbe', label: 'CBE Birr', hint: 'Mobile transfer' },
  { key: 'awash', label: 'Awash Bank', hint: 'Mobile transfer' },
];

export interface OrderRow {
  id: string;
  order_number: string;
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  payment_method: string;
  status: OrderStatus;
  items: CartItem[];
  total: number;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  picked_up: boolean;
}
