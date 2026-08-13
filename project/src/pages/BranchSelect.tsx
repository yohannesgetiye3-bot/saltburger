import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, UtensilsCrossed, Clock, ShieldCheck } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { supabase } from '@/lib/supabase';
import type { Branch } from '@/lib/types';
import { Logo } from '@/components/Logo';

export default function BranchSelect() {
  const { setBranch } = useShop();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        setError('Could not load branches. Check your connection.');
        return;
      }
      setBranches(data as Branch[]);
    })();
  }, []);

  const choose = (b: Branch) => {
    setBranch(b);
    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* hero */}
      <div className="relative bg-salt-500 text-white px-5 pt-12 pb-10 rounded-b-[2rem] overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10" />
        <div className="absolute right-16 top-20 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-6">
            <Logo className="w-9 h-9 text-white" />
            <span className="font-display font-extrabold text-xl tracking-tight">SALT BURGER</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold leading-tight">
            Pick &amp; go.<br />Fresh, fast, fuel-side.
          </h1>
          <p className="mt-2 text-white/85 text-sm">
            Order ahead from 7 locations across Addis Ababa and pick up without waiting.
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-24">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-salt-500" />
          <h2 className="font-display text-lg font-bold">Choose your pickup branch</h2>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {branches === null && !error && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl skeleton" />
            ))}
          </div>
        )}

        <div className="space-y-3">
          {branches?.map((b) => (
            <button
              key={b.id}
              onClick={() => choose(b)}
              className="w-full text-left group flex items-center gap-3 rounded-2xl border border-charcoal-100 bg-white p-4 shadow-card hover:border-salt-400 hover:shadow-pop transition-all active:scale-[0.99]"
            >
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-salt-50 text-salt-600 shrink-0">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-charcoal-900 truncate">{b.name}</p>
                <p className="text-xs text-charcoal-400 truncate">{b.address}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-charcoal-300 group-hover:text-salt-500 transition-colors" />
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-charcoal-50 p-4">
            <Clock className="w-5 h-5 text-salt-500 mb-2" />
            <p className="text-sm font-semibold">Open daily</p>
            <p className="text-xs text-charcoal-400">6:00 AM – 11:00 PM</p>
          </div>
          <div className="rounded-2xl bg-charcoal-50 p-4">
            <ShieldCheck className="w-5 h-5 text-salt-500 mb-2" />
            <p className="text-sm font-semibold">Guest checkout</p>
            <p className="text-xs text-charcoal-400">No account needed</p>
          </div>
        </div>

        <Link
          to="/admin"
          className="mt-6 block text-center text-xs text-charcoal-400 hover:text-charcoal-700"
        >
          Kitchen staff? Open admin dashboard
        </Link>
      </div>
    </div>
  );
}
