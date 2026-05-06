import { CSSProperties } from 'react';

interface ProgressRingProps {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  trackColor?: string;
  fillColor?: string;
  label?: string;
  sublabel?: string;
  style?: CSSProperties;
}

export function ProgressRing({
  value,
  size = 140,
  stroke = 12,
  trackColor = 'rgba(119, 78, 36, 0.15)',
  fillColor = '#6E0D25',
  label,
  sublabel,
  style,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size, ...style }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fillColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        {label && <div className="font-display text-2xl text-bronze leading-tight">{label}</div>}
        {sublabel && (
          <div className="text-xs text-walnut/70 mt-0.5 uppercase tracking-wider">{sublabel}</div>
        )}
      </div>
    </div>
  );
}
