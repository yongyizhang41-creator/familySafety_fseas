// Render supplies its public URL automatically for same-origin deployments.
export const clientOrigin = process.env.CLIENT_ORIGIN ||
  process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';
