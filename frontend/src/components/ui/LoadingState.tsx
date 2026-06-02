import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingState({
  text = 'Cargando...',
  fullScreen = false,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen ? 'min-h-[60vh]' : 'py-16',
        className
      )}
    >
      <div className="relative">
        <div className="w-12 h-12 border-4 border-slate-700 rounded-full" />
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin absolute inset-0" />
      </div>
      {text && (
        <p className="text-slate-400 text-sm font-medium">{text}</p>
      )}
    </div>
  );
}
