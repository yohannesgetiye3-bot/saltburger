import { useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { LogOut, MapPin, RefreshCw, QrCode, Camera, X, CheckCircle2, Clock, AlertCircle, ImagePlus, UtensilsCrossed, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, type Branch, type MenuItem, type OrderRow, type OrderStatus } from '@/lib/types';
import { formatETB, timeAgo, classNames } from '@/lib/utils';
import { LogoLockup } from '@/components/Logo';
import AdminLogin, { useAdminAuth } from '@/pages/AdminLogin';

type Tab = 'paid' | 'pending' | 'completed';

export default function Admin() {
  const { authed, login, logout } = useAdminAuth();
  if (!authed) {
    return <AdminLogin onLogin={login} />;
  }
  return <Dashboard onLogout={logout} />;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<'orders' | 'images'>('orders');
  const refreshTimer = useRef<number | null>(null);

  const load = async () => {
    const [{ data: b }, { data: o }] = await Promise.all([
      supabase.from('branches').select('*').order('sort_order', { ascending: true }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setBranches((b as Branch[]) || []);
    setOrders((o as OrderRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    refreshTimer.current = window.setInterval(load, 8000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (branchFilter !== 'all' && o.branch_id !== branchFilter) return false;
      if (tab === 'pending') return o.status === 'pending';
      if (tab === 'paid') return o.status === 'paid';
      return o.status === 'completed';
    });
  }, [orders, branchFilter, tab]);

  const counts = useMemo(() => {
    const inBranch = (o: OrderRow) => branchFilter === 'all' || o.branch_id === branchFilter;
    return {
      pending: orders.filter((o) => inBranch(o) && o.status === 'pending').length,
      paid: orders.filter((o) => inBranch(o) && o.status === 'paid').length,
      completed: orders.filter((o) => inBranch(o) && o.status === 'completed').length,
    };
  }, [orders, branchFilter]);

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? 'Unknown';

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const setStatus = async (id: string, status: OrderStatus) => {
    const patch: Partial<OrderRow> = { status };
    if (status === 'completed') {
      patch.completed_at = new Date().toISOString();
      patch.picked_up = true;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } as OrderRow : o)));
    await supabase.from('orders').update(patch).eq('id', id);
  };

  const completeByOrderNumber = async (orderNumber: string): Promise<{ ok: boolean; message: string }> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .maybeSingle();
    if (error || !data) return { ok: false, message: 'Order not found. Check the code and try again.' };
    const order = data as OrderRow;
    if (order.picked_up) return { ok: false, message: 'Order already picked up.' };
    await setStatus(order.id, 'completed');
    return { ok: true, message: `Order ${order.order_number} marked complete.` };
  };

  return (
    <div className="min-h-screen bg-charcoal-50 pb-24">
      {/* header */}
      <div className="sticky top-0 z-30 bg-charcoal-900 text-white pt-safe">
        <div className="px-4 py-3 flex items-center justify-between">
          <LogoLockup dark />
          <button onClick={onLogout} className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/10 px-3 py-1.5 rounded-full">
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
        {/* view switch */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => setView('orders')}
            className={classNames('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
              view === 'orders' ? 'bg-salt-500 text-white' : 'bg-white/10 text-white/70')}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" /> Orders
          </button>
          <button
            onClick={() => setView('images')}
            className={classNames('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
              view === 'images' ? 'bg-salt-500 text-white' : 'bg-white/10 text-white/70')}
          >
            <ImagePlus className="w-3.5 h-3.5" /> Images
          </button>
        </div>
      </div>

      {view === 'orders' ? (
        <>
          {/* branch filter */}
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 mb-2 text-xs text-charcoal-500">
              <MapPin className="w-3.5 h-3.5 text-salt-500" /> Filter by branch
            </div>
            <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
              <FilterChip active={branchFilter === 'all'} onClick={() => setBranchFilter('all')}>All branches</FilterChip>
              {branches.map((b) => (
                <FilterChip key={b.id} active={branchFilter === b.id} onClick={() => setBranchFilter(b.id)}>
                  {b.name}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* tabs */}
          <div className="px-4 mt-4 grid grid-cols-3 gap-2">
            <TabBtn icon={<Clock className="w-3.5 h-3.5" />} label="Pending" count={counts.pending} active={tab === 'pending'} onClick={() => setTab('pending')} tone="amber" />
            <TabBtn icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Paid & Ready" count={counts.paid} active={tab === 'paid'} onClick={() => setTab('paid')} tone="green" />
            <TabBtn icon={<AlertCircle className="w-3.5 h-3.5" />} label="Completed" count={counts.completed} active={tab === 'completed'} onClick={() => setTab('completed')} tone="gray" />
          </div>

          {/* list */}
          <div className="px-4 mt-4 space-y-3">
            {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-16 text-charcoal-400">
                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No {tab} orders{branchFilter !== 'all' ? ' for this branch' : ''}.</p>
              </div>
            )}
            {filtered.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                branchName={branchName(o.branch_id)}
                onApprove={() => setStatus(o.id, 'paid')}
                onComplete={() => setStatus(o.id, 'completed')}
              />
            ))}
          </div>

          {/* scan button */}
          <button
            onClick={() => setScannerOpen(true)}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-salt-500 text-white font-bold px-5 py-3.5 rounded-2xl shadow-pop active:scale-95 transition-transform"
          >
            <QrCode className="w-5 h-5" /> Scan QR
          </button>
        </>
      ) : (
        <ImageManagement />
      )}

      {/* scanner */}
      {scannerOpen && (
        <ScannerModal
          onClose={() => setScannerOpen(false)}
          onResult={async (code) => {
            const res = await completeByOrderNumber(code);
            flash(res.message);
            if (res.ok) setScannerOpen(false);
            return res.ok;
          }}
        />
      )}

      {/* toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-charcoal-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-pop animate-pop-in max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={classNames('shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
        active ? 'bg-salt-500 text-white' : 'bg-white text-charcoal-600 border border-charcoal-100')}
    >
      {children}
    </button>
  );
}

function TabBtn({ icon, label, count, active, onClick, tone }: {
  icon: React.ReactNode; label: string; count: number; active: boolean; onClick: () => void; tone: 'amber' | 'green' | 'gray';
}) {
  const toneClass = tone === 'amber' ? 'text-amber-600 bg-amber-50' : tone === 'green' ? 'text-salt-600 bg-salt-50' : 'text-charcoal-500 bg-charcoal-100';
  return (
    <button
      onClick={onClick}
      className={classNames('flex flex-col items-start rounded-2xl p-3 transition-all border',
        active ? 'bg-white border-charcoal-200 shadow-card' : 'bg-white/60 border-transparent')}
    >
      <span className={classNames('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', toneClass)}>
        {icon} {count}
      </span>
      <span className="mt-1.5 text-sm font-bold text-charcoal-800">{label}</span>
    </button>
  );
}

function OrderCard({ order, branchName, onApprove, onComplete }: {
  order: OrderRow; branchName: string; onApprove: () => void; onComplete: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display font-bold text-lg">#{order.order_number}</p>
          <p className="text-xs text-charcoal-400">{timeAgo(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-2 text-xs text-charcoal-500 flex items-center gap-1">
        <MapPin className="w-3 h-3 text-salt-500" /> {branchName}
      </div>
      <div className="mt-3 space-y-1">
        {order.items.map((c, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-charcoal-700">{c.qty}× {c.name}</span>
            <span className="text-charcoal-500">{formatETB(c.price * c.qty)}</span>
          </div>
        ))}
      </div>
      {order.notes && (
        <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">Note: {order.notes}</p>
      )}
      <div className="mt-3 border-t border-charcoal-100 pt-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-charcoal-400">{order.customer_name} · {order.customer_phone}</p>
          <p className="font-bold text-salt-600">{formatETB(order.total)} · <span className="capitalize text-charcoal-500 font-medium">{order.payment_method}</span></p>
        </div>
      </div>
      {/* actions */}
      <div className="mt-3 flex gap-2">
        {order.status === 'pending' && (
          <button onClick={onApprove} className="flex-1 flex items-center justify-center gap-1.5 bg-salt-500 text-white text-sm font-semibold py-2.5 rounded-xl active:scale-95 transition-transform">
            <Check className="w-4 h-4" /> Approve payment
          </button>
        )}
        {order.status === 'paid' && (
          <button onClick={onComplete} className="flex-1 flex items-center justify-center gap-1.5 bg-charcoal-900 text-white text-sm font-semibold py-2.5 rounded-xl active:scale-95 transition-transform">
            <CheckCircle2 className="w-4 h-4" /> Mark picked up
          </button>
        )}
        {order.status === 'completed' && (
          <div className="flex-1 flex items-center justify-center gap-1.5 text-charcoal-400 text-sm font-semibold py-2.5">
            <CheckCircle2 className="w-4 h-4 text-salt-500" /> Completed & locked
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map = {
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700' },
    paid: { label: 'Paid & Ready', cls: 'bg-salt-50 text-salt-700' },
    completed: { label: 'Completed', cls: 'bg-charcoal-100 text-charcoal-500' },
  } as const;
  const s = map[status];
  return <span className={classNames('text-[11px] font-bold px-2.5 py-1 rounded-full', s.cls)}>{s.label}</span>;
}

function ScannerModal({ onClose, onResult }: { onClose: () => void; onResult: (code: string) => Promise<boolean> }) {
  const containerId = 'qr-scan-region';
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const start = async () => {
      try {
        const html5 = new Html5Qrcode(containerId, { verbose: false });
        scannerRef.current = html5;
        await html5.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decoded) => {
            if (!mounted) return;
            mounted = false;
            setProcessing(true);
            const ok = await onResult(decoded);
            setProcessing(false);
            if (!ok) {
              mounted = true;
            }
          },
          () => {}
        );
      } catch (e) {
        setError('Camera unavailable. Enter the order number manually below.');
      }
    };
    start();
    return () => {
      mounted = false;
      const s = scannerRef.current;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
      }
    };
  }, [onResult]);

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manual.trim()) return;
    setProcessing(true);
    const ok = await onResult(manual.trim().toUpperCase());
    setProcessing(false);
    if (!ok) setError('Order not found or already picked up.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-900 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-2 font-semibold"><QrCode className="w-5 h-5 text-salt-400" /> Scan customer QR</div>
        <button onClick={onClose} className="p-1"><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div id={containerId} className="w-full h-full" />
        {!error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-salt-400 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          </div>
        )}
        {processing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>

      <div className="bg-charcoal-900 p-5 pb-safe">
        {error && (
          <div className="mb-3 text-amber-400 text-sm bg-amber-500/10 rounded-lg px-3 py-2">{error}</div>
        )}
        <form onSubmit={submitManual} className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Enter SALT-XXXX manually"
            className="flex-1 rounded-xl bg-white/10 text-white placeholder:text-white/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salt-400"
          />
          <button type="submit" className="bg-salt-500 text-white font-semibold px-4 rounded-xl">Verify</button>
        </form>
        <p className="text-white/40 text-xs mt-3 text-center">Point the camera at the customer's pickup QR code.</p>
      </div>
    </div>
  );
}

// ===== Image management =====
function ImageManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCat, setNewCat] = useState('burgers');
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('category', { ascending: true }).order('sort_order', { ascending: true });
    setItems((data as MenuItem[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2500); };

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    setUploading(true);
    const { error } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
    setUploading(false);
    if (error) { flash('Upload failed.'); return null; }
    const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
    return pub.publicUrl;
  };

  const onPickImage = async (file: File, item?: MenuItem) => {
    const url = await uploadFile(file);
    if (!url) return;
    if (item) {
      await supabase.from('menu_items').update({ image_url: url }).eq('id', item.id);
      flash(`${item.name} image updated.`);
    } else {
      await supabase.from('menu_items').insert({
        name: newName || 'New Item',
        description: newDesc || '',
        price: Number(newPrice) || 0,
        category: newCat,
        image_url: url,
        is_available: true,
      });
      flash('New item added with image.');
      setNewName(''); setNewDesc(''); setNewPrice('');
    }
    load();
  };

  return (
    <div className="px-4 pt-4 pb-12">
      <div className="rounded-2xl bg-white p-4 shadow-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ImagePlus className="w-4 h-4 text-salt-500" />
          <h2 className="font-display font-bold">Add new product / special</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="col-span-2 rounded-xl border border-charcoal-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salt-400" />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" className="col-span-2 rounded-xl border border-charcoal-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salt-400" />
          <input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} inputMode="decimal" placeholder="Price ETB" className="rounded-xl border border-charcoal-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salt-400" />
          <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="rounded-xl border border-charcoal-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salt-400 bg-white">
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <label className="mt-3 flex items-center justify-center gap-2 border-2 border-dashed border-charcoal-200 rounded-xl py-4 text-sm text-charcoal-500 cursor-pointer hover:border-salt-400 hover:text-salt-600 transition-colors">
          <Camera className="w-5 h-5" />
          {uploading ? 'Uploading…' : 'Choose product image'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickImage(f); }} />
        </label>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-bold">Menu items</h2>
        <button onClick={load} className="text-xs text-charcoal-400 flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton mb-2" />)}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-charcoal-50 overflow-hidden shrink-0 flex items-center justify-center">
              {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <UtensilsCrossed className="w-5 h-5 text-charcoal-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{item.name}</p>
              <p className="text-xs text-charcoal-400">{formatETB(item.price)} · <span className="capitalize">{item.category}</span></p>
            </div>
            <label className="shrink-0 cursor-pointer p-2 rounded-lg bg-charcoal-50 hover:bg-salt-50 transition-colors">
              <Camera className="w-4 h-4 text-charcoal-500" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickImage(f, item); }} />
            </label>
            <button
              onClick={async () => { await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id); load(); }}
              className={classNames('shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg', item.is_available ? 'bg-salt-50 text-salt-700' : 'bg-charcoal-100 text-charcoal-400')}
            >
              {item.is_available ? 'Live' : 'Hidden'}
            </button>
          </div>
        ))}
      </div>

      {selected && <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelected(null)} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-charcoal-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-pop animate-pop-in">{toast}</div>
      )}
    </div>
  );
}
