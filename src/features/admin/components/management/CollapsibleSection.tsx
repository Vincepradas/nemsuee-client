import type { ReactNode } from "react";

export function CollapsibleSection(props: {
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const { title, description, isOpen, onToggle, children } = props;
  return (
    <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className="text-xs font-medium text-slate-600">
          {isOpen ? "Collapse" : "Expand"}
        </span>
      </button>
      {isOpen && <div className="border-t border-slate-200 p-4">{children}</div>}
    </article>
  );
}
