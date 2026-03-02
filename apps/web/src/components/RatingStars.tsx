type Props = {
  rating?: number;
  size?: 'sm' | 'md';
};

export function RatingStars({ rating = 0, size = 'sm' }: Props) {
  const rounded = Math.round(rating * 2) / 2;
  const starSize = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rounded} out of 5`}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const value = idx + 1;
        const isFull = rounded >= value;
        const isHalf = !isFull && rounded >= value - 0.5;

        return (
          <span key={value} className={`${starSize} inline-flex items-center justify-center text-amber-500`}>
            <svg viewBox="0 0 24 24" className={starSize} fill={isFull ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
              {isHalf ? <path d="M12 17.3 5.8 21l1.7-7.1L2 9.1l7.3-.6L12 2v15.3Z" fill="currentColor" /> : null}
              <path d="M12 2l2.7 6.5 7.3.6-5.5 4.8 1.7 7.1L12 17.3 5.8 21l1.7-7.1L2 9.1l7.3-.6L12 2Z" />
            </svg>
          </span>
        );
      })}
    </div>
  );
}
