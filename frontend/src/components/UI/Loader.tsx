import clsx from 'clsx';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeMap = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' };

export function Loader({ size = 'md', text, className }: LoaderProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={clsx(
          'rounded-full border-emerald-500 border-t-transparent animate-spin',
          sizeMap[size]
        )}
      />
      {text && <p className="text-slate-400 text-sm">{text}</p>}
    </div>
  );
}

export function FullPageLoader({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <Loader size="lg" text={text ?? 'Loading...'} />
    </div>
  );
}
