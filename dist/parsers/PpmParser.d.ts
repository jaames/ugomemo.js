/**
 * PPM decoder
 * Reads frames, audio, and metadata from Flipnote Studio PPM files
 * Based on my Python PPM decoder implementation (https://github.com/jaames/flipnote-tools)
 *
 * Credits:
 *  PPM format reverse-engineering and documentation:
 *   - bricklife (http://ugomemo.g.hatena.ne.jp/bricklife/20090307/1236391313)
 *   - mirai-iro (http://mirai-iro.hatenablog.jp/entry/20090116/ugomemo_ppm)
 *   - harimau_tigris (http://ugomemo.g.hatena.ne.jp/harimau_tigris)
 *   - steven (http://www.dsibrew.org/wiki/User:Steven)
 *   - yellows8 (http://www.dsibrew.org/wiki/User:Yellows8)
 *   - PBSDS (https://github.com/pbsds)
 *   - jaames (https://github.com/jaames)
 *  Identifying the PPM sound codec:
 *   - Midmad from Hatena Haiku
 *   - WDLMaster from hcs64.com
 *  Helping me to identify issues with the Python decoder that this is based on:
 *   - Austin Burk (https://sudomemo.net)
 *
 *  Lastly, a huge thanks goes to Nintendo for creating Flipnote Studio,
 *  and to Hatena for providing the Flipnote Hatena online service, both of which inspired so many c:
*/
import { FlipnoteFormat, FlipnoteAudioTrack, FlipnoteMeta, FlipnoteParser } from './FlipnoteParserTypes';
/**
 * PPM file metadata, stores information about its playback, author details, etc
 */
export interface PpmMeta extends FlipnoteMeta {
    /** In-app frame playback speed when the BGM audio track was recorded */
    bgmSpeed: number;
}
/**
 * PPM parser options for enabling optimisations and other extra features.
 * None are currently implemented
 */
export declare type PpmParserSettings = {};
/**
 * Parser class for (DSiWare) Flipnote Studio's PPM animation format.
 *
 * Format docs: https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format
 * @category File Parser
 */
export declare class PpmParser extends FlipnoteParser {
    /** Default PPM parser settings */
    static defaultSettings: PpmParserSettings;
    /** File format type */
    static format: FlipnoteFormat;
    /** Animation frame width */
    static width: number;
    /** Animation frame height */
    static height: number;
    /** Number of animation frame layers */
    static numLayers: number;
    /** Audio track base sample rate */
    static rawSampleRate: number;
    /** Nintendo DSi audio output rate */
    static sampleRate: number;
    /** Global animation frame color palette */
    static globalPalette: import("./FlipnoteParserTypes").FlipnotePaletteColor[];
    /** File format type, reflects {@link PpmParser.format} */
    format: FlipnoteFormat;
    /** Animation frame width, reflects {@link PpmParser.width} */
    imageWidth: number;
    /** Animation frame height, reflects {@link PpmParser.height} */
    imageHeight: number;
    /** X offset for the top-left corner of the animation frame */
    imageOffsetX: number;
    /** Y offset for the top-left corner of the animation frame */
    imageOffsetY: number;
    /** Number of animation frame layers, reflects {@link PpmParser.numLayers} */
    numLayers: number;
    /** Audio track base sample rate, reflects {@link PpmParser.rawSampleRate} */
    rawSampleRate: number;
    /** Audio output sample rate, reflects {@link PpmParser.sampleRate} */
    sampleRate: number;
    /** Global animation frame color palette, reflects {@link PpmParser.globalPalette} */
    globalPalette: import("./FlipnoteParserTypes").FlipnotePaletteColor[];
    /** File metadata, see {@link PpmMeta} for structure */
    meta: PpmMeta;
    /** File format version; always the same as far as we know */
    version: number;
    private layerBuffers;
    private prevLayerBuffers;
    private lineEncodingBuffers;
    private prevDecodedFrame;
    private frameDataLength;
    private soundDataLength;
    private frameOffsets;
    /**
     * Create a new PPM file parser instance
     * @param arrayBuffer an ArrayBuffer containing file data
     * @param settings parser settings (none currently implemented)
     */
    constructor(arrayBuffer: ArrayBuffer, settings?: Partial<PpmParserSettings>);
    static validateFSID(fsid: string): boolean;
    static validateFilename(filename: string): boolean;
    private decodeHeader;
    private readFilename;
    private decodeMeta;
    private decodeAnimationHeader;
    private decodeSoundHeader;
    private isNewFrame;
    /**
     * Decode a frame, returning the raw pixel buffers for each layer
     * @category Image
    */
    decodeFrame(frameIndex: number): [Uint8Array, Uint8Array];
    /**
     * Get the layer draw order for a given frame
     * @category Image
     * @returns Array of layer indexes, in the order they should be drawn
    */
    getFrameLayerOrder(frameIndex?: number): number[];
    /**
     * Get the color palette indices for a given frame. RGBA colors for these values can be indexed from {@link PpmParser.globalPalette}
     *
     * Returns an array where:
     *  - index 0 is the paper color index
     *  - index 1 is the layer 1 color index
     *  - index 2 is the layer 2 color index
     * @category Image
    */
    getFramePaletteIndices(frameIndex: number): number[];
    /**
     * Get the RGBA colors for a given frame
     *
     * Returns an array where:
     *  - index 0 is the paper color
     *  - index 1 is the layer 1 color
     *  - index 2 is the layer 2 color
     * @category Image
     */
    getFramePalette(frameIndex: number): import("./FlipnoteParserTypes").FlipnotePaletteColor[];
    /**
     * Get the pixels for a given frame layer
     * @category Image
    */
    getLayerPixels(frameIndex: number, layerIndex: number): Uint8Array;
    /**
     * Get the pixels for a given frame
     * @category Image
    */
    getFramePixels(frameIndex: number): Uint8Array;
    /**
     * Get the sound effect flags for every frame in the Flipnote
     * @category Audio
    */
    decodeSoundFlags(): any[];
    /**
     * Get the raw compressed audio data for a given track
     * @returns byte array
     * @category Audio
    */
    getAudioTrackRaw(trackId: FlipnoteAudioTrack): Uint8Array;
    /**
     * Get the decoded audio data for a given track, using the track's native samplerate
     * @returns Signed 16-bit PCM audio
     * @category Audio
    */
    decodeAudioTrack(trackId: FlipnoteAudioTrack): Int16Array;
    /**
     * Get the decoded audio data for a given track, using the specified samplerate
     * @returns Signed 16-bit PCM audio
     * @category Audio
    */
    getAudioTrackPcm(trackId: FlipnoteAudioTrack, dstFreq?: number): Int16Array;
    private pcmAudioMix;
    /**
     * Get the full mixed audio for the Flipnote, using the specified samplerate
     * @returns Signed 16-bit PCM audio
     * @category Audio
    */
    getAudioMasterPcm(dstFreq?: number): Int16Array;
}
