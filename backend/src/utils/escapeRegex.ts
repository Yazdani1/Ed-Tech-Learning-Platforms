/** Makes user text safe to use inside a RegExp / $regex: it is matched literally (no injection, no ReDoS). */
export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
