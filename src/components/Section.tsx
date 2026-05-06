import { ReactNode } from 'react';

interface SectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
}

export function Section({ title, description, icon, actions, children, id }: SectionProps) {
  return (
    <section id={id} className="card">
      <header className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="shrink-0 w-10 h-10 rounded-lg bg-wine/10 text-wine flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xl text-bronze font-display font-semibold leading-tight">{title}</h2>
            {description && <p className="text-sm text-walnut/70 mt-1">{description}</p>}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div>{children}</div>
    </section>
  );
}
