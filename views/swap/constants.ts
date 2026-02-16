export const CARD_STYLE = {
  background: 'var(--swap-card-bg)',
  boxShadow: 'var(--swap-card-shadow)',
  border: '1px solid var(--swap-card-border)',
  backdropFilter: 'blur(var(--blur-lg)) saturate(1.5)',
} as const;

export const CARD_SPRING = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  delay: 0.05,
};
