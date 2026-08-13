import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { CheckCircle2, Clock, MapPin, ArrowRight, Home } from 'lucide-react';
import { formatETB, formatTime } from '@/lib/utils';
import { LogoLockup } from '@/components/Logo';

const RECEIPT_KEY = 'salt_active_receipt';

interface Receipt {
  order_number: string;
  branch_name: string;
  customer_name: string;
  payment_method: string;
  items: { name: string; price: number; qty: number }[];
  total: number;
  created_at: string;
}

export default function Receipt() {
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [qr, setQr] = useState<string>('');

  useEffect(() => {
    const raw = localStorage.getItem(RECEIPT_KEY);
    if (!raw) {
      navigate('/');
      return;
    }
    setReceipt(JSON.parse(raw));
  }, [navigate]);

  useEffect(() => {
    if (!receipt) return;
    QRCode.toDataURL(receipt.order_number, { width: 260, margin: 1, color: { dark: '#141414', light: '#ffffff' } })
      .then(setQr)
      .catch(() => {});
  }, [receipt]);

  if (!receipt) return null;

  return (
    <div className="min-h-screen bg-charcoal-50 flex flex-col items-center px-5 pt-8 pb-12">
      {/* success header */}
      <div className="w-full max-w-md flex flex-col items-center text-center animate-pop-in">
        <div className="w-16 h-16 rounded-full bg-salt-50 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-9 h-9 text-salt-500" />
        </div>
        <h1 className="font-display text-2xl font-extrabold">Order placed!</h1>
        <p className="text-sm text-charcoal-500 mt-1">Show this QR code at pickup to collect your order.</p>
      </div>

      {/* ticket */}
      <div className="w-full max-w-md mt-6 bg-white rounded-3xl shadow-card overflow-hidden animate-slide-up">
        {/* top strip */}
        <div className="bg-salt-500 px-5 py-4 flex items-center justify-between">
          <LogoLockup dark />
          <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">PICKUP TICKET</span>
        </div>

        <div className="p-6">
          <div className="text-center">
            <p className="text-xs text-charcoal-400 uppercase tracking-widest">Order number</p>
            <p className="font-display text-3xl font-extrabold tracking-tight mt-1">#{receipt.order_number}</p>
          </div>

          {/* QR */}
          <div className="mt-5 flex justify-center">
            {qr ? (
              <img src={qr} alt="Order QR code" className="w-56 h-56 rounded-2xl border border-charcoal-100" />
            ) : (
              <div className="w-56 h-56 rounded-2xl skeleton" />
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-charcoal-500 bg-charcoal-50 rounded-xl py-2.5">
            <Clock className="w-3.5 h-3.5 text-salt-500" />
            {formatTime(receipt.created_at)}
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-salt-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-charcoal-400">Pickup at</p>
                <p className="font-semibold">{receipt.branch_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 mt-0.5 shrink-0 text-salt-500 font-bold text-center text-xs">N</span>
              <div>
                <p className="text-xs text-charcoal-400">Name</p>
                <p className="font-semibold">{receipt.customer_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 mt-0.5 shrink-0 text-salt-500 font-bold text-center text-xs">P</span>
              <div>
                <p className="text-xs text-charcoal-400">Payment</p>
                <p className="font-semibold capitalize">{receipt.payment_method}</p>
              </div>
            </div>
          </div>

          {/* items */}
          <div className="mt-5 border-t border-dashed border-charcoal-200 pt-4 space-y-2">
            {receipt.items.map((c, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-charcoal-700">{c.qty}× {c.name}</span>
                <span className="font-medium">{formatETB(c.price * c.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-charcoal-100 pt-3 flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold text-salt-600">{formatETB(receipt.total)}</span>
          </div>
        </div>

        {/* perforation */}
        <div className="relative h-6">
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-charcoal-200" />
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-charcoal-50" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-charcoal-50" />
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-charcoal-400">
            Keep this tab open. Your ticket is saved on this phone so you won't lose it if you close the app.
          </p>
        </div>
      </div>

      {/* actions */}
      <div className="w-full max-w-md mt-6 flex gap-3">
        <button
          onClick={() => navigate('/menu')}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-charcoal-100 font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform"
        >
          Order more <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => { localStorage.removeItem(RECEIPT_KEY); navigate('/'); }}
          className="flex-1 flex items-center justify-center gap-2 bg-charcoal-900 text-white font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform"
        >
          <Home className="w-4 h-4" /> Home
        </button>
      </div>
    </div>
  );
}
