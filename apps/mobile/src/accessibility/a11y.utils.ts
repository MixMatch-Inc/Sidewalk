export const generateId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export const isKeyboardEvent = (e: KeyboardEvent) =>
  e.key === 'Enter' || e.key === ' ';