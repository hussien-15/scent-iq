import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon' | 'text';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'border border-gold bg-gold text-ink hover:bg-gold-bright hover:border-gold-bright',
  secondary: 'border border-gold/45 bg-transparent text-gold-bright hover:bg-gold/10 hover:border-gold',
  ghost: 'border border-transparent bg-transparent text-smoke hover:bg-white/5 hover:text-parchment',
  danger: 'border border-red-300/35 bg-red-400/10 text-red-200 hover:bg-red-400/20 hover:border-red-300/60',
  icon: 'border border-ink-line bg-ink-soft text-smoke hover:border-gold/45 hover:text-gold-bright',
  text: 'border border-transparent bg-transparent text-gold-bright hover:text-gold',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-10 px-4 py-2 text-xs',
  md: 'min-h-11 px-6 py-2.5 text-sm',
  lg: 'min-h-12 px-8 py-3 text-sm',
};

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  const round =
    variant === 'icon' ? 'aspect-square rounded-full px-0' : variant === 'text' ? 'rounded-md px-1' : 'rounded-full';
  return `inline-flex items-center justify-center gap-2 font-medium transition-[background-color,border-color,color,transform] duration-200 disabled:pointer-events-none disabled:opacity-45 ${round} ${variants[variant]} ${sizes[size]} ${className}`;
}

const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }
>(function Button({ variant = 'primary', size = 'md', loading = false, children, className, disabled, ...props }, ref) {
  return (
    <button
      {...props}
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
    >
      {loading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export default Button;
