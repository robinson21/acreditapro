import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  estado: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  ACTIVO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  INACTIVO: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  BLOQUEADO: 'bg-red-500/20 text-red-400 border-red-500/30',
  PENDIENTE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  APROBADO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  RECHAZADO: 'bg-red-500/20 text-red-400 border-red-500/30',
  ACREDITADO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  NO_ACREDITADO: 'bg-red-500/20 text-red-400 border-red-500/30',
  EN_REVISION: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  POR_VENCER: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  VIGENTE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  VENCIDO: 'bg-red-500/20 text-red-400 border-red-500/30',
  OBSERVADO: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  FINALIZADO: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  CANCELADO: 'bg-red-500/20 text-red-400 border-red-500/30',
  EN_PAUSA: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  POR_FIRMAR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  RESCINDIDO: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  BLOQUEADO: 'Bloqueado',
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  ACREDITADO: 'Acreditado',
  NO_ACREDITADO: 'No Acreditado',
  EN_REVISION: 'En Revisión',
  POR_VENCER: 'Por Vencer',
  VIGENTE: 'Vigente',
  VENCIDO: 'Vencido',
  OBSERVADO: 'Observado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  EN_PAUSA: 'En Pausa',
  POR_FIRMAR: 'Por Firmar',
  RESCINDIDO: 'Rescindido',
};

export default function StatusBadge({ estado, className }: StatusBadgeProps) {
  const color = statusColors[estado] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  const label = statusLabels[estado] || estado;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        color,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-emerald-400': ['ACTIVO', 'APROBADO', 'ACREDITADO', 'VIGENTE'].includes(estado),
        'bg-red-400': ['BLOQUEADO', 'RECHAZADO', 'NO_ACREDITADO', 'VENCIDO', 'CANCELADO', 'RESCINDIDO'].includes(estado),
        'bg-amber-400': ['PENDIENTE', 'POR_VENCER', 'EN_PAUSA', 'OBSERVADO'].includes(estado),
        'bg-blue-400': ['EN_REVISION', 'POR_FIRMAR'].includes(estado),
        'bg-slate-400': ['INACTIVO', 'FINALIZADO'].includes(estado),
      })} />
      {label}
    </span>
  );
}
