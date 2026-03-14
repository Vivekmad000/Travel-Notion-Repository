const CURSOR_COLORS = [
  "#E63946", "#2A9D8F", "#E9C46A", "#F4A261", "#264653",
  "#6A4C93", "#1982C4", "#8AC926", "#FF595E", "#FFCA3A",
];

/** Deterministic color for a user based on their ID */
export function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}
