import { ReactNode } from 'react';
import clsx from 'clsx';

interface GameLayoutProps {
  children: ReactNode;
  className?: string;
}

export function GameLayout({ children, className }: GameLayoutProps) {
  return (
    <div
      className={clsx(
        'min-h-screen bg-slate-950 text-slate-100 font-game',
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}

export function PageContainer({ children, className, narrow }: PageContainerProps) {
  return (
    <div
      className={clsx(
        'mx-auto px-4 py-8',
        narrow ? 'max-w-md' : 'max-w-4xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'bg-slate-900/80 border border-slate-700/60 rounded-2xl shadow-xl backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
