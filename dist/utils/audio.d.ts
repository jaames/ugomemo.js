/** @internal */
export declare const ADPCM_INDEX_TABLE_2BIT: Int8Array;
/** @internal */
export declare const ADPCM_INDEX_TABLE_4BIT: Int8Array;
/** @internal */
export declare const ADPCM_STEP_TABLE: Int16Array;
/** @internal */
export declare function clamp(n: number, l: number, h: number): number;
/** @internal */
export declare function pcmGetSample(src: Int16Array, srcSize: number, srcPtr: number): number;
/**
 * Zero-order hold (nearest neighbour) audio interpolation
 * Credit to SimonTime for the original C version
 * @internal
 */
export declare function pcmResampleNearestNeighbour(src: Int16Array, srcFreq: number, dstFreq: number): Int16Array;
/**
 * Simple linear audio interpolation
 * @internal
 */
export declare function pcmResampleLinear(src: Int16Array, srcFreq: number, dstFreq: number): Int16Array;
/**
 * Get a ratio of how many audio samples hit the pcm_s16_le clipping bounds
 * This can be used to detect corrupted audio
 * @internal
 */
export declare function pcmGetClippingRatio(src: Int16Array): number;
