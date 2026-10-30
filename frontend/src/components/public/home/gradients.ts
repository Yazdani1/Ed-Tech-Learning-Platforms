/** Card colours of the home page's category and learning-path cards (same as the old client). */
export const CARD_GRADIENTS = [
  'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
  'linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)',
  'linear-gradient(135deg, #86198f 0%, #ec4899 100%)',
  'linear-gradient(135deg, #166534 0%, #84cc16 100%)',
  'linear-gradient(135deg, #4338ca 0%, #a78bfa 100%)',
] as const;

export const gradientAt = (index: number): string =>
  CARD_GRADIENTS[index % CARD_GRADIENTS.length] ?? CARD_GRADIENTS[0];

/** Header of teacher cards. */
export const TEACHER_GRADIENT = 'linear-gradient(135deg, #0f766e 0%, #2563eb 55%, #7c3aed 100%)';
