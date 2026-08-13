import { classNames } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="23" className="fill-current" />
      {/* burger mark */}
      <path d="M10 20c0-4.4 6.3-8 14-8s14 3.6 14 8H10z" fill="#fff" />
      <rect x="10" y="22" width="28" height="3" rx="1.5" fill="#FFE08A" />
      <path d="M10 27h28v3c0 2.2-1.8 4-4 4H14c-2.2 0-4-1.8-4-4v-3z" fill="#fff" />
      {/* salt sprinkle */}
      <circle cx="18" cy="16" r="1.2" fill="#00A651" />
      <circle cx="24" cy="14.5" r="1.2" fill="#00A651" />
      <circle cx="30" cy="16" r="1.2" fill="#00A651" />
    </svg>
  );
}

export function LogoLockup({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={classNames('flex items-center gap-2', className)}>
      <Logo className={classNames('w-8 h-8', dark ? 'text-salt-500' : 'text-salt-500')} />
      <span className={classNames(
        'font-display font-extrabold tracking-tight text-lg',
        dark ? 'text-white' : 'text-charcoal-900'
      )}>
        SALT BURGER
      </span>
    </div>
  );
}
