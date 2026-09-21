/** Only proper axis-aligned track rotations. Never guess rotation/mirroring. */
export function trackRotation(matrix?: ArrayLike<number>): number {
  if (!matrix) return 0;
  const key = [matrix[0], matrix[1], matrix[3], matrix[4]].join(',');
  const rotations: Record<string, number> = {
    '65536,0,0,65536': 0, '0,65536,-65536,0': 90,
    '-65536,0,0,-65536': 180, '0,-65536,65536,0': 270,
  };
  if (!(key in rotations) || matrix[2] !== 0 || matrix[5] !== 0 || matrix[8] !== 1073741824)
    throw new Error('対応していない映像の回転・変形情報です。');
  return rotations[key];
}
