import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  change?: number;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'cyan';
  className?: string;
  onClick?: () => void;
}

const colorVariants = {
  blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20',
  emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
  amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20',
  red: 'from-red-600/20 to-red-600/5 border-red-500/20',
  purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20',
  cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-500/20',
};

const iconColors = {
  blue: 'bg-blue-500/20 text-blue-400',
  emerald: 'bg-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/20 text-amber-400',
  red: 'bg-red-500/20 text-red-400',
  purple: 'bg-purple-500/20 text-purple-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
};

export default function StatCard({
  icon,
  title,
  value,
  change,
  color = 'blue',
  className,
  onClick,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border p-5 bg-gradient-to-br cursor-pointer transition-all duration-300 hover:shadow-lg',
        colorVariants[color],
        onClick && 'hover:border-slate-600',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-lg', iconColors[color])}>
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              isPositive && 'bg-emerald-500/20 text-emerald-400',
              isNegative && 'bg-red-500/20 text-red-400'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400 mt-1">{title}</p>
      </div>
    </motion.div>
  );
}
