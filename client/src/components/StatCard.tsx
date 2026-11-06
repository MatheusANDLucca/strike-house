import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'red' | 'sky' | 'emerald' | 'amber' | 'rose' | 'purple';
  trend?: string;
  trendPositive?: boolean;
}

const variantStyles = {
  red: {
    border: 'hover:border-red-500/50',
    iconBg: 'bg-red-500/10 text-red-400 border border-red-500/20',
    textGlow: 'group-hover:text-red-300',
    dot: 'bg-red-400',
  },
  sky: {
    border: 'hover:border-red-500/50',
    iconBg: 'bg-red-500/10 text-red-400 border border-red-500/20',
    textGlow: 'group-hover:text-red-300',
    dot: 'bg-red-400',
  },
  emerald: {
    border: 'hover:border-emerald-500/50',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    textGlow: 'group-hover:text-emerald-300',
    dot: 'bg-emerald-400',
  },
  amber: {
    border: 'hover:border-amber-500/50',
    iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    textGlow: 'group-hover:text-amber-300',
    dot: 'bg-amber-400',
  },
  rose: {
    border: 'hover:border-rose-500/50',
    iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    textGlow: 'group-hover:text-rose-300',
    dot: 'bg-rose-400',
  },
  purple: {
    border: 'hover:border-purple-500/50',
    iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    textGlow: 'group-hover:text-purple-300',
    dot: 'bg-purple-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'red',
  trend,
  trendPositive,
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-[#111622] p-5 border border-[#2A3654] transition-all duration-200 shadow-lg hover:shadow-xl ${styles.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className={`mt-2 text-2xl md:text-3xl font-extrabold text-white tracking-tight transition-colors ${styles.textGlow}`}>
            {value}
          </div>
          {subtitle && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${styles.dot}`}></span>
              <span>{subtitle}</span>
            </div>
          )}
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${styles.iconBg} transition-transform group-hover:scale-105`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-[#1E293B]/60 flex items-center text-xs font-medium">
          <span className={trendPositive ? 'text-emerald-400' : 'text-rose-400'}>
            {trend}
          </span>
          <span className="ml-1 text-slate-500">vs período anterior</span>
        </div>
      )}
    </div>
  );
};
