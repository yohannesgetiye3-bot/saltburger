import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, MapPin, Wallet } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { supabase } from '@/lib/supabase';
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/types';
import { formatETB, generateOrderNumber, classNames } from '@/lib/utils';
import { LogoLockup } from '@/components/Logo';

const RECEIPT_KEY = 'salt_active_receipt';

export default function Checkout() {
  const navigate = useNavigate();
  const { branch, cart, cartTotal, clearCart } = useShop();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!branch) {
    navigate('/');
    return null;
  }
  if (cart.length === 0 && !submitting) {
    navigate('/menu');
    return null;
  }

  const valid = name.trim().length >= 2 && phone.trim().length >= 9;

  const submit = async () => {
    if (!valid || !branch) return;
    setSubmitting(true);
    setError(null);
    const orderNumber = generateOrderNumber();
    const payload = {
      order_number: orderNumber,
      branch_id: branch.id,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      payment_method: payment,
      status: payment === 'cash' ? 'pending' : 'pending',
      items: cart,
      total: cartTotal,
      notes: notes.trim() || null,
    };
    const { error } = await supabase.from('orders').insert(payload);
    if (error) {
      setError('Could not place order. Please try again.');
      setSubmitting(false);
      return;
    }
    const receipt = {
      order_number: orderNumber,
      branch_name: branch.name,
      customer_name: name.trim(),
      payment_method: payment,
      items: cart,
      total: cartTotal,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
    clearCart();
    navigate('/receipt');
  };

  return (
    <div className="min-h-screen bg-charcoal-50 pb-32">
      <div className="sticky top-0 z-30 bg-white border-b border-charcoal-100 pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/menu')} className="p-1 -ml-1 text-charcoal-600"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-display text-lg font-bold">Checkout</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* branch summary */}
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 text-xs text-charcoal-400 mb-1">
            <MapPin className="w-3.5 h-3.5 text-salt-500" /> Pickup branch
          </div>
          <p className="font-semibold">{branch.name}</p>
          <p className="text-xs text-charcoal-400">{branch.address}</p>
        </div>

        {/* order summary */}
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wide mb-3">Order summary</p>
          <div className="space-y-2">
            {cart.map((c) => (
              <div key={c.id} className="flex justify-between text-sm">
                <span className="text-charcoal-700">{c.qty}× {c.name}</span>
                <span className="font-medium">{formatETB(c.price * c.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-charcoal-100 mt-3 pt-3 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-salt-600">{formatETB(cartTotal)}</span>
          </div>
        </div>

        {/* customer info */}
        <div className="rounded-2xl bg-white p-4 shadow-card space-y-4">
          <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wide">Your details</p>
          <div>
            <label className="text-sm font-medium text-charcoal-700">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Abebe Bekele"
              className="mt-1 w-full rounded-xl border border-charcoal-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salt-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-charcoal-700">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="e.g. 0912345678"
              className="mt-1 w-full rounded-xl border border-charcoal-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salt-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-charcoal-700">Order notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything the kitchen should know?"
              className="mt-1 w-full rounded-xl border border-charcoal-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salt-400"
            />
          </div>
        </div>

        {/* payment */}
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-salt-500" />
            <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wide">Payment method</p>
          </div>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPayment(p.key)}
                className={classNames(
                  'w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all',
                  payment === p.key ? 'border-salt-500 bg-salt-50' : 'border-charcoal-100'
                )}
              >
                <div>
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className="text-xs text-charcoal-400">{p.hint}</p>
                </div>
                <div className={classNames(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  payment === p.key ? 'border-salt-500 bg-salt-500' : 'border-charcoal-200'
                )}>
                  {payment === p.key && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            ))}
          </div>
          {payment !== 'cash' && (
            <p className="mt-3 text-xs text-charcoal-500 bg-charcoal-50 rounded-lg p-3">
              Complete your mobile transfer to the branch number, then show the receipt at pickup. An admin can manually verify your order if the connection drops.
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}
      </div>

      {/* sticky pay button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-charcoal-100 p-4 pb-safe max-w-md mx-auto">
        <button
          onClick={submit}
          disabled={!valid || submitting}
          className={classNames(
            'w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all',
            valid && !submitting ? 'bg-salt-500 text-white shadow-pop active:scale-[0.98]' : 'bg-charcoal-100 text-charcoal-400'
          )}
        >
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Placing order…</> : <>Place order · {formatETB(cartTotal)}</>}
        </button>
      </div>
    </div>
  );
}
