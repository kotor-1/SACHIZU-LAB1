/**
 * Minimal HEVC access-unit inspection for exact random access.
 *
 * MP4 hvc1/hev1 samples use the length-prefixed format described by hvcC;
 * they are not Annex-B byte streams. This module intentionally classifies
 * only the VCL picture kinds needed by the exact decoder.
 */

export type HevcRandomAccessKind = 'BLA' | 'IDR' | 'CRA';
export type HevcRaslKind = 'RASL_N' | 'RASL_R';

export interface HevcSampleClassification {
  nalUnitTypes: number[];
  vclNalUnitTypes: number[];
  randomAccessKind: HevcRandomAccessKind | null;
  raslKind: HevcRaslKind | null;
  primaryVclNalUnitType: number | null;
}

export class UnsafeHevcSampleStructureError extends Error {
  readonly code = 'UNSAFE_HEVC_SAMPLE_STRUCTURE';

  constructor(reason: string) {
    super(`Cannot safely classify HEVC sample: ${reason}`);
    this.name = 'UnsafeHevcSampleStructureError';
  }
}

/** Read lengthSizeMinusOne from an HEVCDecoderConfigurationRecord (hvcC). */
export function getHevcNalLengthSize(description: ArrayBuffer): number {
  const bytes = new Uint8Array(description);
  if (bytes.byteLength < 22) {
    throw new UnsafeHevcSampleStructureError('hvcC is shorter than 22 bytes.');
  }
  if (bytes[0] !== 1) {
    throw new UnsafeHevcSampleStructureError(
      `unsupported hvcC configurationVersion ${bytes[0]}.`
    );
  }
  return (bytes[21] & 0x03) + 1;
}

/** Parse all NAL unit types from one MP4 length-prefixed HEVC sample. */
export function parseLengthPrefixedHevcNalUnitTypes(
  sampleData: ArrayBuffer,
  nalLengthSize: number
): number[] {
  if (!Number.isInteger(nalLengthSize) || nalLengthSize < 1 || nalLengthSize > 4) {
    throw new UnsafeHevcSampleStructureError(
      `invalid NAL length-prefix size ${nalLengthSize}.`
    );
  }

  const bytes = new Uint8Array(sampleData);
  if (bytes.byteLength === 0) {
    throw new UnsafeHevcSampleStructureError('sample is empty.');
  }

  const nalUnitTypes: number[] = [];
  let offset = 0;
  while (offset < bytes.byteLength) {
    if (offset + nalLengthSize > bytes.byteLength) {
      throw new UnsafeHevcSampleStructureError('truncated NAL length prefix.');
    }

    let nalLength = 0;
    for (let i = 0; i < nalLengthSize; i++) {
      nalLength = (nalLength * 256) + bytes[offset + i];
    }
    offset += nalLengthSize;

    if (nalLength < 2) {
      throw new UnsafeHevcSampleStructureError(
        `NAL unit length ${nalLength} is too short for an HEVC header.`
      );
    }
    if (offset + nalLength > bytes.byteLength) {
      throw new UnsafeHevcSampleStructureError('truncated NAL unit payload.');
    }

    const firstHeaderByte = bytes[offset];
    if ((firstHeaderByte & 0x80) !== 0) {
      throw new UnsafeHevcSampleStructureError('forbidden_zero_bit is set.');
    }
    nalUnitTypes.push((firstHeaderByte >> 1) & 0x3f);
    offset += nalLength;
  }

  return nalUnitTypes;
}

function pictureKindForNalType(
  nalUnitType: number
): HevcRandomAccessKind | HevcRaslKind | 'OTHER' | null {
  if (nalUnitType < 0 || nalUnitType > 31) return null;
  if (nalUnitType >= 16 && nalUnitType <= 18) return 'BLA';
  if (nalUnitType === 19 || nalUnitType === 20) return 'IDR';
  if (nalUnitType === 21) return 'CRA';
  if (nalUnitType === 8) return 'RASL_N';
  if (nalUnitType === 9) return 'RASL_R';
  return 'OTHER';
}

/**
 * Classify a complete HEVC access unit. Conflicting VCL picture families are
 * rejected instead of inventing key-frame authority from one convenient NAL.
 */
export function classifyLengthPrefixedHevcSample(
  sampleData: ArrayBuffer,
  nalLengthSize: number
): HevcSampleClassification {
  const nalUnitTypes = parseLengthPrefixedHevcNalUnitTypes(sampleData, nalLengthSize);
  const vclNalUnitTypes = nalUnitTypes.filter((type) => type <= 31);
  const pictureKinds = new Set(
    vclNalUnitTypes
      .map(pictureKindForNalType)
      .filter((kind): kind is Exclude<ReturnType<typeof pictureKindForNalType>, null> => kind !== null)
  );

  if (pictureKinds.size > 1) {
    throw new UnsafeHevcSampleStructureError(
      `conflicting VCL picture kinds: ${Array.from(pictureKinds).join(', ')}.`
    );
  }

  const pictureKind = pictureKinds.values().next().value as
    | HevcRandomAccessKind
    | HevcRaslKind
    | 'OTHER'
    | undefined;
  const randomAccessKind = pictureKind === 'BLA' || pictureKind === 'IDR' || pictureKind === 'CRA'
    ? pictureKind
    : null;
  const raslKind = pictureKind === 'RASL_N' || pictureKind === 'RASL_R'
    ? pictureKind
    : null;

  return {
    nalUnitTypes,
    vclNalUnitTypes,
    randomAccessKind,
    raslKind,
    primaryVclNalUnitType: vclNalUnitTypes[0] ?? null,
  };
}
