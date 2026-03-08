import { useMemo, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  noResultsLabel?: string;
};

export function SearchableDropdown({
  value,
  onChange,
  options,
  placeholder = "Search...",
  className = "",
  noResultsLabel = "No matching results.",
}: Props) {
  const [open, setOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options.slice(0, 20);
    return options
      .filter((option) => option.toLowerCase().includes(q))
      .slice(0, 20);
  }, [options, value]);

  return (
    <div className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        className="h-10 w-full rounded border border-slate-300 px-3 text-sm"
      />
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-64 overflow-y-auto rounded border border-slate-200 bg-white p-1 shadow-lg">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className="w-full rounded px-2 py-2 text-left text-sm hover:bg-slate-100"
              >
                <span className="block truncate">{option}</span>
              </button>
            ))
          ) : (
            <p className="px-2 py-2 text-sm text-slate-500">{noResultsLabel}</p>
          )}
        </div>
      )}
    </div>
  );
}
