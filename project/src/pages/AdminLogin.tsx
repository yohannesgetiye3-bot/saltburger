import { useEffect, useState } from 'react';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { LogoLockup } from '@/components/Logo';
import { classNames } from '@/lib/utils';

const ADMIN_PIN_KEY = 'salt_admin_pin';
const DEFAULT_PIN = '1234';

export function useAdminAuth() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(ADMIN_PIN_KEY) === '1');
  }, []);

  const login = (pin: string) => {
    if (pin === DEFAULT_PIN) {
      sessionStorage.setItem(ADMIN_PIN_KEY, '1');
      setAuthed(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_PIN_KEY);
    setAuthed(false);
  };

  return { authed, login, logout };
}

export default function AdminLogin({ onLogin }: { onLogin: (pin: string) => boolean }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(pin)) {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-salt-500 flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <LogoLockup dark />
          <p className="text-white/60 text-sm mt-2">Kitchen admin dashboard</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-3xl p-6 shadow-pop">
          <label className="flex items-center gap-2 text-sm font-semibold text-charcoal-700 mb-2">
            <Lock className="w-4 h-4 text-salt-500" /> Enter PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="• • • •"
            autoFocus
            className={classNames(
              'w-full text-center text-2xl tracking-[0.5em] font-bold rounded-xl border py-3 focus:outline-none focus:ring-2',
              error ? 'border-red-300 ring-red-200' : 'border-charcoal-100 focus:ring-salt-400'
            )}
          />
          {error && <p className="text-red-500 text-xs mt-2 text-center">Incorrect PIN. Try again.</p>}
          <button
            type="submit"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-salt-500 text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-transform"
          >
            Enter dashboard <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-charcoal-400 text-center mt-3">Demo PIN: 1234</p>
        </form>
      </div>
    </div>
  );
}
