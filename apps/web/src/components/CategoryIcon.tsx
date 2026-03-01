type Props = {
  category:
    | 'friseur'
    | 'naegel'
    | 'haarentfernung'
    | 'kosmetik'
    | 'massage'
    | 'maenner'
    | 'frauen';
  className?: string;
};

export function CategoryIcon({ category, className = 'h-4 w-4' }: Props) {
  if (category === 'friseur') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19" />
      </svg>
    );
  }

  if (category === 'naegel') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="7" width="4" height="10" rx="2" />
        <rect x="10" y="5" width="4" height="12" rx="2" />
        <rect x="15" y="8" width="4" height="9" rx="2" />
      </svg>
    );
  }

  if (category === 'haarentfernung') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 4l10 16M10 4l7 11M5 14h6" />
      </svg>
    );
  }

  if (category === 'kosmetik') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="9" r="4" />
        <path d="M7 20c1.5-2 3-3 5-3s3.5 1 5 3" />
      </svg>
    );
  }

  if (category === 'massage') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 12c4-1 6-5 8-8 2 3 4 7 8 8-4 1-6 5-8 8-2-3-4-7-8-8z" />
      </svg>
    );
  }

  if (category === 'maenner') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 4h6v6M20 4l-7 7" />
        <circle cx="9" cy="15" r="5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.8-3 4-4.5 7-4.5s5.2 1.5 7 4.5" />
    </svg>
  );
}
