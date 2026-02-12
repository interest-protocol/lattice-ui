/**
 * Truncates an email for display, keeping the @domain intact.
 * "johndoe.smith@gmail.com" → "johnd...@gmail.com"
 * "hi@a.com" → "hi@a.com" (short enough, no truncation)
 */
export const formatEmail = (email: string, maxLocal = 5): string => {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);

  if (local.length <= maxLocal) return email;

  return `${local.slice(0, maxLocal)}...${domain}`;
};
