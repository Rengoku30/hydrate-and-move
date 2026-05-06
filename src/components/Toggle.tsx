interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer select-none">
      <div className="flex-1 min-w-0">
        {label && <div className="font-semibold text-walnut">{label}</div>}
        {description && <div className="text-sm text-walnut/70 mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors
          ${checked ? 'bg-wine' : 'bg-bronze/30'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-cream shadow transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  );
}
