import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: string;
  trend?: string;
  delay?: number;
  onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, gradient, trend, delay = 0, onClick }: StatCardProps) {
  return (
    <Card
      className={`p-6 hover-lift animate-scale-in glass-effect border-none shadow-md cursor-pointer ${gradient ? `bg-gradient-to-br ${gradient}` : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          {trend && (
            <p className="text-xs text-white/60">{trend}</p>
          )}
        </div>
        <div className="p-3 bg-white/20 rounded-xl">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );
}
