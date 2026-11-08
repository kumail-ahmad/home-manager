import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
};

export default function FloralCard({ title, icon: Icon, children, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl bg-floral-blush p-5 shadow-md hover:shadow-lg transition-shadow',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="h-5 w-5 text-floral-rose" />}
        <h3 className="text-lg font-semibold text-floral-earth">{title}</h3>
      </div>
      <div className="text-floral-earth">{children}</div>
    </div>
  );
}
