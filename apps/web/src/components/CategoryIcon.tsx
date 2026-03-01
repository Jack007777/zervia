type Props = {
  category: 'beauty' | 'wellness' | 'fitness' | 'massage';
  className?: string;
};

export function CategoryIcon({ category, className = 'h-4 w-4' }: Props) {
  if (category === 'beauty') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19" />
      </svg>
    );
  }

  if (category === 'wellness') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3c-3 3-4.5 5.3-4.5 8A4.5 4.5 0 0012 15.5 4.5 4.5 0 0016.5 11C16.5 8.3 15 6 12 3z" />
        <path d="M4 20c2-2 4-3 8-3s6 1 8 3" />
      </svg>
    );
  }

  if (category === 'fitness') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10v4M21 10v4M7 8v8M17 8v8M9 12h6" />
        <path d="M5 12h2M17 12h2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12c4-1 6-5 8-8 2 3 4 7 8 8-4 1-6 5-8 8-2-3-4-7-8-8z" />
    </svg>
  );
}

