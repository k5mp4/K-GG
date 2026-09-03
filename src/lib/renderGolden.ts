export const REPRESENTATIVE_RENDER_GOLDEN = {
  id: 'default-stack-v2',
  preset: 'Kagaribi_15',
  resolution: { width: 800, height: 800 },
  times: [0, 0.5, 1],
  seeds: {
    noise: 0,
    diffuse: 0,
    stretch: 12,
    flow: 42,
  },
  paths: ['preview', 'thumbnail', 'static', 'sequence', 'video', 'tile'],
} as const;
