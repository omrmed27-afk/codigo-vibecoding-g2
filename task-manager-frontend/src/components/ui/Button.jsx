import Spinner from './Spinner';

const variants = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white focus:ring-brand-500',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-brand-500',
  danger: 'bg-danger-500 hover:opacity-90 text-white focus:ring-danger-500',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 focus:ring-brand-500',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
