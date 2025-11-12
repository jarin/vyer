/**
 * Noise generation functions for terrain creation
 * Implements a simplex-like noise algorithm with fractal/multi-octave support
 */

/**
 * 2D noise function with hash-based randomization
 * @param x - X coordinate
 * @param z - Z coordinate
 * @param seed - Seed for variation
 * @returns Noise value between 0 and 1
 */
export function noise2D(x: number, z: number, seed = 0): number {
  const X = Math.floor(x) + seed;
  const Z = Math.floor(z) + seed;
  const xf = x - Math.floor(x);
  const zf = z - Math.floor(z);

  // Simple hash function for pseudo-random values
  const hash = (a: number, b: number): number => {
    let h = a * 374761393 + b * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) / 2147483648.0;
  };

  const n00 = hash(X, Z);
  const n10 = hash(X + 1, Z);
  const n01 = hash(X, Z + 1);
  const n11 = hash(X + 1, Z + 1);

  // Smoothstep interpolation for smoother results
  const sx = xf * xf * (3 - 2 * xf);
  const sz = zf * zf * (3 - 2 * zf);

  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;

  return nx0 * (1 - sz) + nx1 * sz;
}

/**
 * Fractal noise using multiple octaves for more realistic terrain
 * @param x - X coordinate
 * @param z - Z coordinate
 * @param octaves - Number of noise layers to combine
 * @param persistence - How much each octave contributes (typically 0.5)
 * @returns Normalized fractal noise value
 */
export function fractalNoise(
  x: number,
  z: number,
  octaves = 4,
  persistence = 0.5
): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency * 0.05, z * frequency * 0.05, i) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxValue;
}
