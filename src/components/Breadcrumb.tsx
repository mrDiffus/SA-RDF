import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-[11px] uppercase tracking-widest mb-8">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />}
            {isLast || !item.href ? (
              <span className={isLast ? 'text-white font-semibold' : 'text-zinc-500'}>{item.label}</span>
            ) : (
              <Link to={item.href} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
