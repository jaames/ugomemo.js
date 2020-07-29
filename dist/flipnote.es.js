/*!!
 flipnote.js v5.0.0 (web version)
 Browser-based playback of .ppm and .kwz animations from Flipnote Studio and Flipnote Studio 3D
 2018 - 2020 James Daniel
 github.com/jaames/flipnote.js
 Flipnote Studio is (c) Nintendo Co., Ltd.
*/

var urlLoader = {
    matches: function (source) {
        return typeof source === 'string';
    },
    load: function (source, resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', source, true);
        xhr.responseType = 'arraybuffer';
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                }
                else {
                    reject({
                        type: 'httpError',
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
                }
            }
        };
        xhr.send(null);
    }
};

var fileLoader = {
    matches: function (source) {
        return (typeof File !== 'undefined' && source instanceof File);
    },
    load: function (source, resolve, reject) {
        if (typeof FileReader !== 'undefined') {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve(reader.result);
            };
            reader.onerror = (event) => {
                reject({ type: 'fileReadError' });
            };
            reader.readAsArrayBuffer(source);
        }
        else {
            reject();
        }
    }
};

var arrayBufferLoader = {
    matches: function (source) {
        return (source instanceof ArrayBuffer);
    },
    load: function (source, resolve, reject) {
        resolve(source);
    }
};

const loaders = [
    urlLoader,
    fileLoader,
    arrayBufferLoader
];
function loadSource(source) {
    return new Promise(function (resolve, reject) {
        loaders.forEach(loader => {
            if (loader.matches(source)) {
                loader.load(source, resolve, reject);
            }
        });
    });
}

class ByteArray {
    constructor() {
        this.page = -1;
        this.pages = [];
        this.cursor = 0;
        this.newPage();
    }
    newPage() {
        this.pages[++this.page] = new Uint8Array(ByteArray.pageSize);
        this.cursor = 0;
    }
    getData() {
        const data = new Uint8Array((this.page) * ByteArray.pageSize + this.cursor);
        this.pages.map((page, index) => {
            if (index === this.page)
                data.set(page.slice(0, this.cursor), index * ByteArray.pageSize);
            else
                data.set(page, index * ByteArray.pageSize);
        });
        return data;
    }
    getBuffer() {
        const data = this.getData();
        return data.buffer;
    }
    writeByte(val) {
        if (this.cursor >= ByteArray.pageSize)
            this.newPage();
        this.pages[this.page][this.cursor++] = val;
    }
    writeBytes(array, offset, length) {
        for (let l = length || array.length, i = offset || 0; i < l; i++)
            this.writeByte(array[i]);
    }
}
ByteArray.pageSize = 4096;

class DataStream {
    constructor(arrayBuffer) {
        this.buffer = arrayBuffer;
        this.data = new DataView(arrayBuffer);
        this.cursor = 0;
    }
    get bytes() {
        return new Uint8Array(this.buffer);
    }
    get byteLength() {
        return this.data.byteLength;
    }
    seek(offset, whence) {
        switch (whence) {
            case 2 /* End */:
                this.cursor = this.data.byteLength + offset;
                break;
            case 1 /* Current */:
                this.cursor += offset;
                break;
            case 0 /* Begin */:
            default:
                this.cursor = offset;
                break;
        }
    }
    readUint8() {
        const val = this.data.getUint8(this.cursor);
        this.cursor += 1;
        return val;
    }
    writeUint8(value) {
        this.data.setUint8(this.cursor, value);
        this.cursor += 1;
    }
    readInt8() {
        const val = this.data.getInt8(this.cursor);
        this.cursor += 1;
        return val;
    }
    writeInt8(value) {
        this.data.setInt8(this.cursor, value);
        this.cursor += 1;
    }
    readUint16(littleEndian = true) {
        const val = this.data.getUint16(this.cursor, littleEndian);
        this.cursor += 2;
        return val;
    }
    writeUint16(value, littleEndian = true) {
        this.data.setUint16(this.cursor, value, littleEndian);
        this.cursor += 2;
    }
    readInt16(littleEndian = true) {
        const val = this.data.getInt16(this.cursor, littleEndian);
        this.cursor += 2;
        return val;
    }
    writeInt16(value, littleEndian = true) {
        this.data.setInt16(this.cursor, value, littleEndian);
        this.cursor += 2;
    }
    readUint32(littleEndian = true) {
        const val = this.data.getUint32(this.cursor, littleEndian);
        this.cursor += 4;
        return val;
    }
    writeUint32(value, littleEndian = true) {
        this.data.setUint32(this.cursor, value, littleEndian);
        this.cursor += 4;
    }
    readInt32(littleEndian = true) {
        const val = this.data.getInt32(this.cursor, littleEndian);
        this.cursor += 4;
        return val;
    }
    writeInt32(value, littleEndian = true) {
        this.data.setInt32(this.cursor, value, littleEndian);
        this.cursor += 4;
    }
    readBytes(count) {
        const bytes = new Uint8Array(this.data.buffer, this.cursor, count);
        this.cursor += bytes.byteLength;
        return bytes;
    }
    writeBytes(bytes) {
        bytes.forEach((byte) => this.writeUint8(byte));
    }
    readHex(count, reverse = false) {
        const bytes = this.readBytes(count);
        let hex = [];
        for (let i = 0; i < bytes.length; i++) {
            hex.push(bytes[i].toString(16).padStart(2, '0'));
        }
        if (reverse)
            hex.reverse();
        return hex.join('').toUpperCase();
    }
    readChars(count) {
        const chars = this.readBytes(count);
        let str = '';
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            if (char === 0)
                break;
            str += String.fromCharCode(char);
        }
        return str;
    }
    writeChars(string) {
        for (let i = 0; i < string.length; i++) {
            const char = string.charCodeAt(i);
            this.writeUint8(char);
        }
    }
    readWideChars(count) {
        const chars = new Uint16Array(this.data.buffer, this.cursor, count);
        let str = '';
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            if (char == 0)
                break;
            str += String.fromCharCode(char);
        }
        this.cursor += chars.byteLength;
        return str;
    }
}

var FlipnoteAudioTrack;
(function (FlipnoteAudioTrack) {
    FlipnoteAudioTrack[FlipnoteAudioTrack["BGM"] = 0] = "BGM";
    FlipnoteAudioTrack[FlipnoteAudioTrack["SE1"] = 1] = "SE1";
    FlipnoteAudioTrack[FlipnoteAudioTrack["SE2"] = 2] = "SE2";
    FlipnoteAudioTrack[FlipnoteAudioTrack["SE3"] = 3] = "SE3";
    FlipnoteAudioTrack[FlipnoteAudioTrack["SE4"] = 4] = "SE4";
})(FlipnoteAudioTrack || (FlipnoteAudioTrack = {}));
class FlipnoteParserBase extends DataStream {
    hasAudioTrack(trackId) {
        if (this.soundMeta.hasOwnProperty(trackId) && this.soundMeta[trackId].length > 0) {
            return true;
        }
        return false;
    }
}

function clamp(n, l, h) {
    if (n < l)
        return l;
    if (n > h)
        return h;
    return n;
}
// zero-order hold interpolation
function pcmDsAudioResample(src, srcFreq, dstFreq) {
    const srcDuration = src.length / srcFreq;
    const dstLength = srcDuration * dstFreq;
    const dst = new Int16Array(dstLength);
    const adjFreq = (srcFreq) / dstFreq;
    for (let n = 0; n < dst.length; n++) {
        dst[n] = src[Math.floor(n * adjFreq)];
    }
    return dst;
}
function pcmAudioMix(src, dst, dstOffset = 0) {
    const srcSize = src.length;
    const dstSize = dst.length;
    for (let n = 0; n < srcSize; n++) {
        if (dstOffset + n > dstSize)
            break;
        // half src volume
        const samp = dst[dstOffset + n] + (src[n] / 2);
        dst[dstOffset + n] = clamp(samp, -32768, 32767);
    }
}
const ADPCM_INDEX_TABLE_2BIT = new Int8Array([
    -1, 2, -1, 2
]);
const ADPCM_INDEX_TABLE_4BIT = new Int8Array([
    -1, -1, -1, -1, 2, 4, 6, 8,
    -1, -1, -1, -1, 2, 4, 6, 8
]);
// note that this is a slight deviation from the normal adpcm table
const ADPCM_STEP_TABLE = new Int16Array([
    7, 8, 9, 10, 11, 12, 13, 14, 16, 17,
    19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
    50, 55, 60, 66, 73, 80, 88, 97, 107, 118,
    130, 143, 157, 173, 190, 209, 230, 253, 279, 307,
    337, 371, 408, 449, 494, 544, 598, 658, 724, 796,
    876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066,
    2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
    5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
    15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767, 0
]);
const ADPCM_SAMPLE_TABLE_2BIT = new Int16Array(90 * 4);
for (let sample = 0; sample < 4; sample++) {
    for (let stepIndex = 0; stepIndex < 90; stepIndex++) {
        let step = ADPCM_STEP_TABLE[stepIndex];
        let diff = step >> 3;
        if (sample & 1)
            diff += step;
        if (sample & 2)
            diff = -diff;
        ADPCM_SAMPLE_TABLE_2BIT[sample + 4 * stepIndex] = diff;
    }
}
const ADPCM_SAMPLE_TABLE_4BIT = new Int16Array(90 * 16);
for (let sample = 0; sample < 16; sample++) {
    for (let stepIndex = 0; stepIndex < 90; stepIndex++) {
        let step = ADPCM_STEP_TABLE[stepIndex];
        let diff = step >> 3;
        if (sample & 4)
            diff += step;
        if (sample & 2)
            diff += step >> 1;
        if (sample & 1)
            diff += step >> 2;
        if (sample & 8)
            diff = -diff;
        ADPCM_SAMPLE_TABLE_4BIT[sample + 16 * stepIndex] = diff;
    }
}

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
// internal frame speed value -> FPS table
const FRAMERATES = [0.5, 0.5, 1, 2, 4, 6, 12, 20, 30];
const PALETTE = {
    WHITE: [0xff, 0xff, 0xff, 0xff],
    BLACK: [0x0e, 0x0e, 0x0e, 0xff],
    RED: [0xff, 0x2a, 0x2a, 0xff],
    BLUE: [0x0a, 0x39, 0xff, 0xff]
};
const DS_SAMPLE_RATE = 32768;
class PpmParser extends FlipnoteParserBase {
    constructor(arrayBuffer) {
        super(arrayBuffer);
        this.type = PpmParser.type;
        this.width = PpmParser.width;
        this.height = PpmParser.height;
        this.globalPalette = PpmParser.globalPalette;
        this.rawSampleRate = PpmParser.rawSampleRate;
        this.sampleRate = PpmParser.sampleRate;
        this.prevDecodedFrame = null;
        this.decodeHeader();
        this.decodeAnimationHeader();
        this.decodeSoundHeader();
        // this is always true afaik, it's likely just a remnamt from development
        // doesn't hurt to be accurate though...
        if (((this.version >> 4) & 0xf) !== 0) {
            this.decodeMeta();
        }
        // create image buffers
        this.layers = [
            new Uint8Array(PpmParser.width * PpmParser.height),
            new Uint8Array(PpmParser.width * PpmParser.height)
        ];
        this.prevLayers = [
            new Uint8Array(PpmParser.width * PpmParser.height),
            new Uint8Array(PpmParser.width * PpmParser.height)
        ];
        this.prevDecodedFrame = null;
    }
    static validateFSID(fsid) {
        return /[0159]{1}[0-9A-F]{6}0[0-9A-F]{8}/.test(fsid);
    }
    static validateFilename(filename) {
        return /[0-9A-F]{6}_[0-9A-F]{13}_[0-9]{3}/.test(filename);
    }
    decodeHeader() {
        this.seek(0);
        // decode header
        // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#header
        let magic = this.readUint32();
        this.frameDataLength = this.readUint32();
        this.soundDataLength = this.readUint32();
        this.frameCount = this.readUint16() + 1;
        this.version = this.readUint16();
    }
    readFilename() {
        return [
            this.readHex(3),
            this.readChars(13),
            this.readUint16().toString().padStart(3, '0')
        ].join('_');
    }
    decodeMeta() {
        // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#metadata
        this.seek(0x10);
        const lock = this.readUint16(), thumbIndex = this.readInt16(), rootAuthorName = this.readWideChars(11), parentAuthorName = this.readWideChars(11), currentAuthorName = this.readWideChars(11), parentAuthorId = this.readHex(8, true), currentAuthorId = this.readHex(8, true), parentFilename = this.readFilename(), currentFilename = this.readFilename(), rootAuthorId = this.readHex(8, true);
        this.seek(0x9A);
        const timestamp = new Date((this.readUint32() + 946684800) * 1000);
        this.seek(0x06A6);
        const flags = this.readUint16();
        this.thumbFrameIndex = thumbIndex;
        this.meta = {
            lock: lock === 1,
            loop: (flags >> 1 & 0x01) === 1,
            frame_count: this.frameCount,
            frame_speed: this.frameSpeed,
            bgm_speed: this.bgmSpeed,
            thumb_index: thumbIndex,
            timestamp: timestamp,
            spinoff: (currentAuthorId !== parentAuthorId) || (currentAuthorId !== rootAuthorId),
            root: {
                filename: null,
                username: rootAuthorName,
                fsid: rootAuthorId,
            },
            parent: {
                username: parentAuthorName,
                fsid: parentAuthorId,
                filename: parentFilename
            },
            current: {
                username: currentAuthorName,
                fsid: currentAuthorId,
                filename: currentFilename
            },
        };
    }
    decodeAnimationHeader() {
        // jump to the start of the animation data section
        // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#animation-header
        this.seek(0x06A0);
        const offsetTableLength = this.readUint16();
        const numOffsets = offsetTableLength / 4;
        // skip padding + flags
        this.seek(0x06A8);
        // read frame offsets and build them into a table
        const frameOffsets = new Uint32Array(numOffsets);
        for (let n = 0; n < numOffsets; n++) {
            frameOffsets[n] = 0x06A8 + offsetTableLength + this.readUint32();
        }
        this.frameOffsets = frameOffsets;
    }
    decodeSoundHeader() {
        // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#sound-header
        // offset = frame data offset + frame data length + sound effect flags
        let offset = 0x06A0 + this.frameDataLength + this.frameCount;
        // account for multiple-of-4 padding
        if (offset % 4 != 0)
            offset += 4 - (offset % 4);
        this.seek(offset);
        const bgmLen = this.readUint32();
        const se1Len = this.readUint32();
        const se2Len = this.readUint32();
        const se3Len = this.readUint32();
        this.frameSpeed = 8 - this.readUint8();
        this.bgmSpeed = 8 - this.readUint8();
        offset += 32;
        this.framerate = FRAMERATES[this.frameSpeed];
        this.bgmrate = FRAMERATES[this.bgmSpeed];
        this.soundMeta = {
            [FlipnoteAudioTrack.BGM]: { offset: offset, length: bgmLen },
            [FlipnoteAudioTrack.SE1]: { offset: offset += bgmLen, length: se1Len },
            [FlipnoteAudioTrack.SE2]: { offset: offset += se1Len, length: se2Len },
            [FlipnoteAudioTrack.SE3]: { offset: offset += se2Len, length: se3Len },
        };
    }
    isNewFrame(frameIndex) {
        this.seek(this.frameOffsets[frameIndex]);
        const header = this.readUint8();
        return (header >> 7) & 0x1;
    }
    getLayerOrder(frameIndex) {
        return [0, 1];
    }
    readLineEncoding() {
        const unpacked = new Uint8Array(PpmParser.height);
        let unpackedPtr = 0;
        for (var byteIndex = 0; byteIndex < 48; byteIndex++) {
            const byte = this.readUint8();
            // each line's encoding type is stored as a 2-bit value
            for (var bitOffset = 0; bitOffset < 8; bitOffset += 2) {
                unpacked[unpackedPtr++] = (byte >> bitOffset) & 0x03;
            }
        }
        return unpacked;
    }
    decodeFrame(frameIndex) {
        if ((this.prevDecodedFrame !== frameIndex - 1) && (!this.isNewFrame(frameIndex) && (frameIndex !== 0)))
            this.decodeFrame(frameIndex - 1);
        // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#animation-data
        this.seek(this.frameOffsets[frameIndex]);
        const header = this.readUint8();
        const isNewFrame = (header >> 7) & 0x1;
        const isTranslated = (header >> 5) & 0x3;
        let translateX = 0;
        let translateY = 0;
        this.prevDecodedFrame = frameIndex;
        // reset current layer buffers
        this.layers[0].fill(0);
        this.layers[1].fill(0);
        if (isTranslated) {
            translateX = this.readInt8();
            translateY = this.readInt8();
        }
        const layerEncoding = [
            this.readLineEncoding(),
            this.readLineEncoding(),
        ];
        // start decoding layer bitmaps
        for (let layer = 0; layer < 2; layer++) {
            const layerBitmap = this.layers[layer];
            for (let line = 0; line < PpmParser.height; line++) {
                const lineType = layerEncoding[layer][line];
                let chunkOffset = line * PpmParser.width;
                switch (lineType) {
                    // line type 0 = blank line, decode nothing
                    case 0:
                        break;
                    // line types 1 + 2 = compressed bitmap line
                    case 1:
                    case 2:
                        let lineHeader = this.readUint32(false);
                        // line type 2 starts as an inverted line
                        if (lineType == 2)
                            layerBitmap.fill(1, chunkOffset, chunkOffset + PpmParser.width);
                        // loop through each bit in the line header
                        while (lineHeader & 0xFFFFFFFF) {
                            // if the bit is set, this 8-pix wide chunk is stored
                            // else we can just leave it blank and move on to the next chunk
                            if (lineHeader & 0x80000000) {
                                const chunk = this.readUint8();
                                // unpack chunk bits
                                for (let pixel = 0; pixel < 8; pixel++) {
                                    layerBitmap[chunkOffset + pixel] = chunk >> pixel & 0x1;
                                }
                            }
                            chunkOffset += 8;
                            // shift lineheader to the left by 1 bit, now on the next loop cycle the next bit will be checked
                            lineHeader <<= 1;
                        }
                        break;
                    // line type 3 = raw bitmap line
                    case 3:
                        while (chunkOffset < (line + 1) * PpmParser.width) {
                            const chunk = this.readUint8();
                            for (let pixel = 0; pixel < 8; pixel++) {
                                layerBitmap[chunkOffset + pixel] = chunk >> pixel & 0x1;
                            }
                            chunkOffset += 8;
                        }
                        break;
                }
            }
        }
        // if the current frame is based on changes from the preivous one, merge them by XORing their values
        const layer1 = this.layers[0];
        const layer2 = this.layers[1];
        const layer1Prev = this.prevLayers[0];
        const layer2Prev = this.prevLayers[1];
        if (!isNewFrame) {
            let dest, src;
            // loop through each line
            for (let y = 0; y < PpmParser.height; y++) {
                // skip to next line if this one falls off the top edge of the screen
                if (y - translateY < 0)
                    continue;
                // stop once the bottom screen edge has been reached
                if (y - translateY >= PpmParser.height)
                    break;
                // loop through each pixel in the line
                for (let x = 0; x < PpmParser.width; x++) {
                    // skip to the next pixel if this one falls off the left edge of the screen
                    if (x - translateX < 0)
                        continue;
                    // stop diffing this line once the right screen edge has been reached
                    if (x - translateX >= PpmParser.width)
                        break;
                    dest = x + y * PpmParser.width;
                    src = dest - (translateX + translateY * PpmParser.width);
                    // diff pixels with a binary XOR
                    layer1[dest] ^= layer1Prev[src];
                    layer2[dest] ^= layer2Prev[src];
                }
            }
        }
        // copy the current layer buffers to the previous ones
        this.prevLayers[0].set(this.layers[0]);
        this.prevLayers[1].set(this.layers[1]);
        return this.layers;
    }
    getFramePaletteIndices(frameIndex) {
        this.seek(this.frameOffsets[frameIndex]);
        const header = this.readUint8();
        const isInverted = (header & 0x1) !== 1;
        const penMap = [
            isInverted ? 0 : 1,
            isInverted ? 0 : 1,
            2,
            3,
        ];
        return [
            isInverted ? 1 : 0,
            penMap[(header >> 1) & 0x3],
            penMap[(header >> 3) & 0x3],
        ];
    }
    getFramePalette(frameIndex) {
        const indices = this.getFramePaletteIndices(frameIndex);
        return indices.map(colorIndex => this.globalPalette[colorIndex]);
    }
    // retuns an uint8 array where each item is a pixel's palette index
    getLayerPixels(frameIndex, layerIndex) {
        if (this.prevDecodedFrame !== frameIndex) {
            this.decodeFrame(frameIndex);
        }
        const palette = this.getFramePaletteIndices(frameIndex);
        const layer = this.layers[layerIndex];
        const image = new Uint8Array(PpmParser.width * PpmParser.height);
        const layerColor = palette[layerIndex + 1];
        for (let pixel = 0; pixel < image.length; pixel++) {
            if (layer[pixel] === 1)
                image[pixel] = layerColor;
        }
        return image;
    }
    // retuns an uint8 array where each item is a pixel's palette index
    getFramePixels(frameIndex) {
        const palette = this.getFramePaletteIndices(frameIndex);
        const layers = this.decodeFrame(frameIndex);
        const image = new Uint8Array(PpmParser.width * PpmParser.height);
        const layer1 = layers[0];
        const layer2 = layers[1];
        const paperColor = palette[0];
        const layer1Color = palette[1];
        const layer2Color = palette[2];
        image.fill(paperColor);
        for (let pixel = 0; pixel < image.length; pixel++) {
            const a = layer1[pixel];
            const b = layer2[pixel];
            if (a === 1)
                image[pixel] = layer1Color;
            else if (b === 1)
                image[pixel] = layer2Color;
        }
        return image;
    }
    decodeSoundFlags() {
        // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#sound-effect-flags
        this.seek(0x06A0 + this.frameDataLength);
        const numFlags = this.frameCount;
        const flags = this.readBytes(numFlags);
        const unpacked = new Array(numFlags);
        for (let i = 0; i < numFlags; i++) {
            const byte = flags[i];
            unpacked[i] = [
                (byte & 0x1) !== 0,
                (byte & 0x2) !== 0,
                (byte & 0x4) !== 0,
            ];
        }
        return unpacked;
    }
    getAudioTrackRaw(trackId) {
        const trackMeta = this.soundMeta[trackId];
        this.seek(trackMeta.offset);
        return this.readBytes(trackMeta.length);
    }
    // returns decoded PCM samples as an Int16Array
    // note this doesn't resample
    // TODO: kinda slow, maybe use sample lookup table
    decodeAudioTrack(trackId) {
        // decode a 4 bit IMA adpcm audio track
        // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#sound-data
        const src = this.getAudioTrackRaw(trackId);
        const srcSize = src.length;
        const dst = new Int16Array(srcSize * 2);
        let srcPtr = 0;
        let dstPtr = 0;
        let sample = 0;
        let stepIndex = 0;
        let predictor = 0;
        let lowNibble = true;
        while (srcPtr < srcSize) {
            // switch between hi and lo nibble each loop iteration
            // increments srcPtr after every hi nibble
            if (lowNibble)
                sample = src[srcPtr] & 0xF;
            else
                sample = src[srcPtr++] >> 4;
            lowNibble = !lowNibble;
            const step = ADPCM_STEP_TABLE[stepIndex];
            let diff = step >> 3;
            if (sample & 1)
                diff += step >> 2;
            if (sample & 2)
                diff += step >> 1;
            if (sample & 4)
                diff += step;
            if (sample & 8)
                diff = -diff;
            predictor += diff;
            predictor = clamp(predictor, -32768, 32767);
            stepIndex += ADPCM_INDEX_TABLE_4BIT[sample];
            stepIndex = clamp(stepIndex, 0, 88);
            dst[dstPtr++] = predictor;
        }
        return dst;
    }
    // returns decoded PCM samples as an Int16Array, resampled to dstFrq sample rate
    getAudioTrackPcm(trackId, dstFreq = DS_SAMPLE_RATE) {
        const srcPcm = this.decodeAudioTrack(trackId);
        let srcFreq = this.rawSampleRate;
        if (trackId === FlipnoteAudioTrack.BGM) {
            const bgmAdjust = Math.round(this.framerate / this.bgmrate);
            srcFreq = this.rawSampleRate * bgmAdjust;
        }
        if (srcFreq !== dstFreq)
            return pcmDsAudioResample(srcPcm, srcFreq, dstFreq);
        return srcPcm;
    }
    // merges BGM and sound effects into a single master audio track (as PCM Int16 array @ dstFreq sample rate)
    getAudioMasterPcm(dstFreq = DS_SAMPLE_RATE) {
        const duration = this.frameCount * (1 / this.framerate);
        const dstSize = Math.ceil(duration * dstFreq);
        const master = new Int16Array(dstSize);
        const hasBgm = this.hasAudioTrack(FlipnoteAudioTrack.BGM);
        const hasSe1 = this.hasAudioTrack(FlipnoteAudioTrack.SE1);
        const hasSe2 = this.hasAudioTrack(FlipnoteAudioTrack.SE2);
        const hasSe3 = this.hasAudioTrack(FlipnoteAudioTrack.SE3);
        // Mix background music
        if (hasBgm) {
            const bgmPcm = this.getAudioTrackPcm(FlipnoteAudioTrack.BGM, dstFreq);
            pcmAudioMix(bgmPcm, master, 0);
        }
        // Mix sound effects
        if (hasSe1 || hasSe2 || hasSe3) {
            const seFlags = this.decodeSoundFlags();
            const se1Pcm = hasSe1 ? this.getAudioTrackPcm(FlipnoteAudioTrack.SE1, dstFreq) : null;
            const se2Pcm = hasSe2 ? this.getAudioTrackPcm(FlipnoteAudioTrack.SE2, dstFreq) : null;
            const se3Pcm = hasSe3 ? this.getAudioTrackPcm(FlipnoteAudioTrack.SE3, dstFreq) : null;
            const adjFreq = dstFreq / this.rawSampleRate;
            const samplesPerFrame = Math.round(this.rawSampleRate / this.framerate) * adjFreq;
            for (let frame = 0; frame < this.frameCount; frame++) {
                // places sound effect halfway through frame
                const seOffset = (frame + .5) * samplesPerFrame;
                const flag = seFlags[frame];
                if (hasSe1 && flag[0])
                    pcmAudioMix(se1Pcm, master, seOffset);
                if (hasSe2 && flag[1])
                    pcmAudioMix(se2Pcm, master, seOffset);
                if (hasSe3 && flag[2])
                    pcmAudioMix(se3Pcm, master, seOffset);
            }
        }
        return master;
    }
}
PpmParser.type = 'PPM';
PpmParser.width = 256;
PpmParser.height = 192;
PpmParser.rawSampleRate = 8192;
PpmParser.sampleRate = DS_SAMPLE_RATE;
PpmParser.globalPalette = [
    PALETTE.WHITE,
    PALETTE.BLACK,
    PALETTE.RED,
    PALETTE.BLUE
];

// Every possible sequence of pixels for each tile line
const KWZ_LINE_TABLE = new Uint8Array(6561 * 8);
// const pixelValues = [0x0000, 0xFF00, 0x00FF];
var offset = 0;
for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
        for (let c = 0; c < 3; c++)
            for (let d = 0; d < 3; d++)
                for (let e = 0; e < 3; e++)
                    for (let f = 0; f < 3; f++)
                        for (let g = 0; g < 3; g++)
                            for (let h = 0; h < 3; h++) {
                                KWZ_LINE_TABLE.set([
                                    b,
                                    a,
                                    d,
                                    c,
                                    f,
                                    e,
                                    h,
                                    g
                                ], offset);
                                offset += 8;
                            }
// Line offsets, but the lines are shifted to the left by one pixel
const KWZ_LINE_TABLE_SHIFT = new Uint8Array(6561 * 8);
var offset = 0;
for (let a = 0; a < 2187; a += 729)
    for (let b = 0; b < 729; b += 243)
        for (let c = 0; c < 243; c += 81)
            for (let d = 0; d < 81; d += 27)
                for (let e = 0; e < 27; e += 9)
                    for (let f = 0; f < 9; f += 3)
                        for (let g = 0; g < 3; g += 1)
                            for (let h = 0; h < 6561; h += 2187) {
                                const lineTableIndex = a + b + c + d + e + f + g + h;
                                const pixels = KWZ_LINE_TABLE.subarray(lineTableIndex * 8, lineTableIndex * 8 + 8);
                                KWZ_LINE_TABLE_SHIFT.set(pixels, offset);
                                offset += 8;
                            }
// Commonly occuring line offsets
const KWZ_LINE_TABLE_COMMON = new Uint8Array(32 * 8);
[
    0x0000, 0x0CD0, 0x19A0, 0x02D9, 0x088B, 0x0051, 0x00F3, 0x0009,
    0x001B, 0x0001, 0x0003, 0x05B2, 0x1116, 0x00A2, 0x01E6, 0x0012,
    0x0036, 0x0002, 0x0006, 0x0B64, 0x08DC, 0x0144, 0x00FC, 0x0024,
    0x001C, 0x0004, 0x0334, 0x099C, 0x0668, 0x1338, 0x1004, 0x166C
].forEach((lineTableIndex, index) => {
    const pixels = KWZ_LINE_TABLE.subarray(lineTableIndex * 8, lineTableIndex * 8 + 8);
    KWZ_LINE_TABLE_COMMON.set(pixels, index * 8);
});
// Commonly occuring line offsets, but the lines are shifted to the left by one pixel
const KWZ_LINE_TABLE_COMMON_SHIFT = new Uint8Array(32 * 8);
[
    0x0000, 0x0CD0, 0x19A0, 0x0003, 0x02D9, 0x088B, 0x0051, 0x00F3,
    0x0009, 0x001B, 0x0001, 0x0006, 0x05B2, 0x1116, 0x00A2, 0x01E6,
    0x0012, 0x0036, 0x0002, 0x02DC, 0x0B64, 0x08DC, 0x0144, 0x00FC,
    0x0024, 0x001C, 0x099C, 0x0334, 0x1338, 0x0668, 0x166C, 0x1004
].forEach((lineTableIndex, index) => {
    const pixels = KWZ_LINE_TABLE.subarray(lineTableIndex * 8, lineTableIndex * 8 + 8);
    KWZ_LINE_TABLE_COMMON_SHIFT.set(pixels, index * 8);
});

const FRAMERATES$1 = [.2, .5, 1, 2, 4, 6, 8, 12, 20, 24, 30];
const PALETTE$1 = {
    WHITE: [0xff, 0xff, 0xff, 0xff],
    BLACK: [0x10, 0x10, 0x10, 0xff],
    RED: [0xff, 0x10, 0x10, 0xff],
    YELLOW: [0xff, 0xe7, 0x00, 0xff],
    GREEN: [0x00, 0x86, 0x31, 0xff],
    BLUE: [0x00, 0x38, 0xce, 0xff],
    NONE: [0xff, 0xff, 0xff, 0x00]
};
const CTR_SAMPLE_RATE = 32768;
class KwzParser extends FlipnoteParserBase {
    constructor(arrayBuffer) {
        super(arrayBuffer);
        this.type = KwzParser.type;
        this.width = KwzParser.width;
        this.height = KwzParser.height;
        this.globalPalette = KwzParser.globalPalette;
        this.rawSampleRate = KwzParser.rawSampleRate;
        this.sampleRate = KwzParser.sampleRate;
        this.prevDecodedFrame = null;
        this.bitIndex = 0;
        this.bitValue = 0;
        this.layers = [
            new Uint8Array(KwzParser.width * KwzParser.height),
            new Uint8Array(KwzParser.width * KwzParser.height),
            new Uint8Array(KwzParser.width * KwzParser.height),
        ];
        this.bitIndex = 0;
        this.bitValue = 0;
        this.load();
    }
    load() {
        this.seek(0);
        this.sections = {};
        this.frameMeta = [];
        const fileSize = this.byteLength - 256;
        let offset = 0;
        let sectionCount = 0;
        // counting sections should mitigate against one of mrnbayoh's notehax exploits
        while ((offset < fileSize) && (sectionCount < 6)) {
            this.seek(offset);
            const sectionMagic = this.readChars(4).substring(0, 3);
            const sectionLength = this.readUint32();
            this.sections[sectionMagic] = {
                offset: offset,
                length: sectionLength
            };
            offset += sectionLength + 8;
            sectionCount += 1;
        }
        this.decodeMeta();
        this.decodeFrameMeta();
        this.decodeSoundHeader();
    }
    readBits(num) {
        if (this.bitIndex + num > 16) {
            const nextBits = this.readUint16();
            this.bitValue |= nextBits << (16 - this.bitIndex);
            this.bitIndex -= 16;
        }
        const mask = (1 << num) - 1;
        const result = this.bitValue & mask;
        this.bitValue >>= num;
        this.bitIndex += num;
        return result;
    }
    decodeMeta() {
        this.seek(this.sections['KFH'].offset + 12);
        const creationTimestamp = new Date((this.readUint32() + 946684800) * 1000), modifiedTimestamp = new Date((this.readUint32() + 946684800) * 1000), appVersion = this.readUint32(), rootAuthorId = this.readHex(10), parentAuthorId = this.readHex(10), currentAuthorId = this.readHex(10), rootAuthorName = this.readWideChars(11), parentAuthorName = this.readWideChars(11), currentAuthorName = this.readWideChars(11), rootFilename = this.readChars(28), parentFilename = this.readChars(28), currentFilename = this.readChars(28), frameCount = this.readUint16(), thumbIndex = this.readUint16(), flags = this.readUint16(), frameSpeed = this.readUint8(), layerFlags = this.readUint8();
        this.frameCount = frameCount;
        this.thumbFrameIndex = thumbIndex;
        this.frameSpeed = frameSpeed;
        this.framerate = FRAMERATES$1[frameSpeed];
        this.meta = {
            lock: (flags & 0x1) === 1,
            loop: ((flags >> 1) & 0x01) === 1,
            frame_count: frameCount,
            frame_speed: frameSpeed,
            thumb_index: thumbIndex,
            timestamp: modifiedTimestamp,
            creation_timestamp: creationTimestamp,
            root: {
                username: rootAuthorName,
                fsid: rootAuthorId,
                filename: rootFilename,
            },
            parent: {
                username: parentAuthorName,
                fsid: parentAuthorId,
                filename: parentFilename,
            },
            current: {
                username: currentAuthorName,
                fsid: currentAuthorId,
                filename: currentFilename,
            },
        };
    }
    decodeFrameMeta() {
        this.frameOffsets = new Uint32Array(this.frameCount);
        this.seek(this.sections['KMI'].offset + 8);
        let offset = this.sections['KMC'].offset + 12;
        for (let i = 0; i < this.frameCount; i++) {
            const frame = {
                flags: this.readUint32(),
                layerSize: [
                    this.readUint16(),
                    this.readUint16(),
                    this.readUint16()
                ],
                frameAuthor: this.readHex(10),
                layerDepth: [
                    this.readUint8(),
                    this.readUint8(),
                    this.readUint8(),
                ],
                soundFlags: this.readUint8(),
                cameraFlag: this.readUint32(),
            };
            this.frameMeta.push(frame);
            this.frameOffsets[i] = offset;
            offset += frame.layerSize[0] + frame.layerSize[1] + frame.layerSize[2];
        }
    }
    decodeSoundHeader() {
        if (this.sections.hasOwnProperty('KSN')) {
            let offset = this.sections['KSN'].offset + 8;
            this.seek(offset);
            const bgmSpeed = this.readUint32();
            this.bgmSpeed = bgmSpeed;
            this.bgmrate = FRAMERATES$1[bgmSpeed];
            const trackSizes = new Uint32Array(this.buffer, offset + 4, 20);
            this.soundMeta = {
                [FlipnoteAudioTrack.BGM]: { offset: offset += 28, length: trackSizes[0] },
                [FlipnoteAudioTrack.SE1]: { offset: offset += trackSizes[0], length: trackSizes[1] },
                [FlipnoteAudioTrack.SE2]: { offset: offset += trackSizes[1], length: trackSizes[2] },
                [FlipnoteAudioTrack.SE3]: { offset: offset += trackSizes[2], length: trackSizes[3] },
                [FlipnoteAudioTrack.SE4]: { offset: offset += trackSizes[3], length: trackSizes[4] },
            };
        }
    }
    getDiffingFlag(frameIndex) {
        return ~(this.frameMeta[frameIndex].flags >> 4) & 0x07;
    }
    getLayerDepths(frameIndex) {
        return this.frameMeta[frameIndex].layerDepth;
    }
    // sort layer indices sorted by depth, from bottom to top
    getLayerOrder(frameIndex) {
        const depths = this.getLayerDepths(frameIndex);
        return [2, 1, 0].sort((a, b) => depths[b] - depths[a]);
    }
    decodeFrame(frameIndex, diffingFlag = 0x7, isPrevFrame = false) {
        // if this frame is being decoded as a prev frame, then we only want to decode the layers necessary
        if (isPrevFrame)
            diffingFlag &= this.getDiffingFlag(frameIndex + 1);
        // the prevDecodedFrame check is an optimisation for decoding frames in full sequence
        if ((this.prevDecodedFrame !== frameIndex - 1) && (diffingFlag) && (frameIndex !== 0))
            this.decodeFrame(frameIndex - 1, diffingFlag = diffingFlag, isPrevFrame = true);
        const meta = this.frameMeta[frameIndex];
        let offset = this.frameOffsets[frameIndex];
        for (let layerIndex = 0; layerIndex < 3; layerIndex++) {
            this.seek(offset);
            const layerSize = meta.layerSize[layerIndex];
            offset += layerSize;
            // if the layer is 38 bytes then it hasn't changed at all since the previous frame, so we can skip it
            if (layerSize === 38)
                continue;
            if (((diffingFlag >> layerIndex) & 0x1) === 0)
                continue;
            this.bitIndex = 16;
            this.bitValue = 0;
            let skip = 0;
            for (let tileOffsetY = 0; tileOffsetY < KwzParser.height; tileOffsetY += 128) {
                for (let tileOffsetX = 0; tileOffsetX < KwzParser.width; tileOffsetX += 128) {
                    for (let subTileOffsetY = 0; subTileOffsetY < 128; subTileOffsetY += 8) {
                        const y = tileOffsetY + subTileOffsetY;
                        if (y >= KwzParser.height)
                            break;
                        for (let subTileOffsetX = 0; subTileOffsetX < 128; subTileOffsetX += 8) {
                            const x = tileOffsetX + subTileOffsetX;
                            if (x >= KwzParser.width)
                                break;
                            if (skip) {
                                skip -= 1;
                                continue;
                            }
                            const pixelOffset = y * KwzParser.width + x;
                            const pixelBuffer = this.layers[layerIndex];
                            const type = this.readBits(3);
                            if (type == 0) {
                                const lineIndex = this.readBits(5);
                                const pixels = KWZ_LINE_TABLE_COMMON.subarray(lineIndex * 8, lineIndex * 8 + 8);
                                pixelBuffer.set(pixels, pixelOffset);
                                pixelBuffer.set(pixels, pixelOffset + 320);
                                pixelBuffer.set(pixels, pixelOffset + 640);
                                pixelBuffer.set(pixels, pixelOffset + 960);
                                pixelBuffer.set(pixels, pixelOffset + 1280);
                                pixelBuffer.set(pixels, pixelOffset + 1600);
                                pixelBuffer.set(pixels, pixelOffset + 1920);
                                pixelBuffer.set(pixels, pixelOffset + 2240);
                            }
                            else if (type == 1) {
                                const lineIndex = this.readBits(13);
                                const pixels = KWZ_LINE_TABLE.subarray(lineIndex * 8, lineIndex * 8 + 8);
                                pixelBuffer.set(pixels, pixelOffset);
                                pixelBuffer.set(pixels, pixelOffset + 320);
                                pixelBuffer.set(pixels, pixelOffset + 640);
                                pixelBuffer.set(pixels, pixelOffset + 960);
                                pixelBuffer.set(pixels, pixelOffset + 1280);
                                pixelBuffer.set(pixels, pixelOffset + 1600);
                                pixelBuffer.set(pixels, pixelOffset + 1920);
                                pixelBuffer.set(pixels, pixelOffset + 2240);
                            }
                            else if (type == 2) {
                                const lineValue = this.readBits(5);
                                const a = KWZ_LINE_TABLE_COMMON.subarray(lineValue * 8, lineValue * 8 + 8);
                                const b = KWZ_LINE_TABLE_COMMON_SHIFT.subarray(lineValue * 8, lineValue * 8 + 8);
                                pixelBuffer.set(a, pixelOffset);
                                pixelBuffer.set(b, pixelOffset + 320);
                                pixelBuffer.set(a, pixelOffset + 640);
                                pixelBuffer.set(b, pixelOffset + 960);
                                pixelBuffer.set(a, pixelOffset + 1280);
                                pixelBuffer.set(b, pixelOffset + 1600);
                                pixelBuffer.set(a, pixelOffset + 1920);
                                pixelBuffer.set(b, pixelOffset + 2240);
                            }
                            else if (type == 3) {
                                const lineValue = this.readBits(13);
                                const a = KWZ_LINE_TABLE.subarray(lineValue * 8, lineValue * 8 + 8);
                                const b = KWZ_LINE_TABLE_SHIFT.subarray(lineValue * 8, lineValue * 8 + 8);
                                pixelBuffer.set(a, pixelOffset);
                                pixelBuffer.set(b, pixelOffset + 320);
                                pixelBuffer.set(a, pixelOffset + 640);
                                pixelBuffer.set(b, pixelOffset + 960);
                                pixelBuffer.set(a, pixelOffset + 1280);
                                pixelBuffer.set(b, pixelOffset + 1600);
                                pixelBuffer.set(a, pixelOffset + 1920);
                                pixelBuffer.set(b, pixelOffset + 2240);
                            }
                            // most common tile type
                            else if (type == 4) {
                                const mask = this.readBits(8);
                                for (let line = 0; line < 8; line++) {
                                    if (mask & (1 << line)) {
                                        const lineIndex = this.readBits(5);
                                        const pixels = KWZ_LINE_TABLE_COMMON.subarray(lineIndex * 8, lineIndex * 8 + 8);
                                        pixelBuffer.set(pixels, pixelOffset + line * 320);
                                    }
                                    else {
                                        const lineIndex = this.readBits(13);
                                        const pixels = KWZ_LINE_TABLE.subarray(lineIndex * 8, lineIndex * 8 + 8);
                                        pixelBuffer.set(pixels, pixelOffset + line * 320);
                                    }
                                }
                            }
                            else if (type == 5) {
                                skip = this.readBits(5);
                                continue;
                            }
                            // type 6 doesnt exist
                            else if (type == 7) {
                                let pattern = this.readBits(2);
                                let useCommonLines = this.readBits(1);
                                let a;
                                let b;
                                if (useCommonLines) {
                                    const lineIndexA = this.readBits(5);
                                    const lineIndexB = this.readBits(5);
                                    a = KWZ_LINE_TABLE_COMMON.subarray(lineIndexA * 8, lineIndexA * 8 + 8);
                                    b = KWZ_LINE_TABLE_COMMON.subarray(lineIndexB * 8, lineIndexB * 8 + 8);
                                    pattern = (pattern + 1) % 4;
                                }
                                else {
                                    const lineIndexA = this.readBits(13);
                                    const lineIndexB = this.readBits(13);
                                    a = KWZ_LINE_TABLE.subarray(lineIndexA * 8, lineIndexA * 8 + 8);
                                    b = KWZ_LINE_TABLE.subarray(lineIndexB * 8, lineIndexB * 8 + 8);
                                }
                                if (pattern == 0) {
                                    pixelBuffer.set(a, pixelOffset);
                                    pixelBuffer.set(b, pixelOffset + 320);
                                    pixelBuffer.set(a, pixelOffset + 640);
                                    pixelBuffer.set(b, pixelOffset + 960);
                                    pixelBuffer.set(a, pixelOffset + 1280);
                                    pixelBuffer.set(b, pixelOffset + 1600);
                                    pixelBuffer.set(a, pixelOffset + 1920);
                                    pixelBuffer.set(b, pixelOffset + 2240);
                                }
                                else if (pattern == 1) {
                                    pixelBuffer.set(a, pixelOffset);
                                    pixelBuffer.set(a, pixelOffset + 320);
                                    pixelBuffer.set(b, pixelOffset + 640);
                                    pixelBuffer.set(a, pixelOffset + 960);
                                    pixelBuffer.set(a, pixelOffset + 1280);
                                    pixelBuffer.set(b, pixelOffset + 1600);
                                    pixelBuffer.set(a, pixelOffset + 1920);
                                    pixelBuffer.set(a, pixelOffset + 2240);
                                }
                                else if (pattern == 2) {
                                    pixelBuffer.set(a, pixelOffset);
                                    pixelBuffer.set(b, pixelOffset + 320);
                                    pixelBuffer.set(a, pixelOffset + 640);
                                    pixelBuffer.set(a, pixelOffset + 960);
                                    pixelBuffer.set(b, pixelOffset + 1280);
                                    pixelBuffer.set(a, pixelOffset + 1600);
                                    pixelBuffer.set(a, pixelOffset + 1920);
                                    pixelBuffer.set(b, pixelOffset + 2240);
                                }
                                else if (pattern == 3) {
                                    pixelBuffer.set(a, pixelOffset);
                                    pixelBuffer.set(b, pixelOffset + 320);
                                    pixelBuffer.set(b, pixelOffset + 640);
                                    pixelBuffer.set(a, pixelOffset + 960);
                                    pixelBuffer.set(b, pixelOffset + 1280);
                                    pixelBuffer.set(b, pixelOffset + 1600);
                                    pixelBuffer.set(a, pixelOffset + 1920);
                                    pixelBuffer.set(b, pixelOffset + 2240);
                                }
                            }
                        }
                    }
                }
            }
        }
        this.prevDecodedFrame = frameIndex;
        return this.layers;
    }
    getFramePaletteIndices(frameIndex) {
        const { flags } = this.frameMeta[frameIndex];
        return [
            flags & 0xF,
            (flags >> 8) & 0xF,
            (flags >> 12) & 0xF,
            (flags >> 16) & 0xF,
            (flags >> 20) & 0xF,
            (flags >> 24) & 0xF,
            (flags >> 28) & 0xF,
        ];
    }
    getFramePalette(frameIndex) {
        const indices = this.getFramePaletteIndices(frameIndex);
        return indices.map(colorIndex => this.globalPalette[colorIndex]);
    }
    // retuns an uint8 array where each item is a pixel's palette index
    getLayerPixels(frameIndex, layerIndex) {
        if (this.prevDecodedFrame !== frameIndex)
            this.decodeFrame(frameIndex);
        const palette = this.getFramePaletteIndices(frameIndex);
        const layers = this.layers[layerIndex];
        const image = new Uint8Array(KwzParser.width * KwzParser.height);
        const paletteOffset = layerIndex * 2 + 1;
        for (let pixelIndex = 0; pixelIndex < layers.length; pixelIndex++) {
            let pixel = layers[pixelIndex];
            if (pixel === 1)
                image[pixelIndex] = palette[paletteOffset];
            else if (pixel === 2)
                image[pixelIndex] = palette[paletteOffset + 1];
        }
        return image;
    }
    // retuns an uint8 array where each item is a pixel's palette index
    getFramePixels(frameIndex) {
        if (this.prevDecodedFrame !== frameIndex)
            this.decodeFrame(frameIndex);
        const palette = this.getFramePaletteIndices(frameIndex);
        const image = new Uint8Array(KwzParser.width * KwzParser.height);
        image.fill(palette[0]); // fill with paper color first
        const layerOrder = this.getLayerOrder(frameIndex);
        // TODO: fix swimming flipnote
        const layerA = this.layers[layerOrder[2]];
        const layerB = this.layers[layerOrder[1]];
        const layerC = this.layers[layerOrder[0]];
        const layerAColor1 = palette[1];
        const layerAColor2 = palette[2];
        const layerBColor1 = palette[3];
        const layerBColor2 = palette[4];
        const layerCColor1 = palette[5];
        const layerCColor2 = palette[6];
        for (let pixel = 0; pixel < image.length; pixel++) {
            const a = layerA[pixel];
            const b = layerB[pixel];
            const c = layerC[pixel];
            if (a === 1)
                image[pixel] = layerAColor1;
            else if (a === 2)
                image[pixel] = layerAColor2;
            else if (b === 1)
                image[pixel] = layerBColor1;
            else if (b === 2)
                image[pixel] = layerBColor2;
            else if (c === 1)
                image[pixel] = layerCColor1;
            else if (c === 2)
                image[pixel] = layerCColor2;
        }
        return image;
    }
    decodeSoundFlags() {
        return this.frameMeta.map(frame => {
            const soundFlags = frame.soundFlags;
            return [
                (soundFlags & 0x1) !== 0,
                (soundFlags & 0x2) !== 0,
                (soundFlags & 0x4) !== 0,
                (soundFlags & 0x8) !== 0,
            ];
        });
    }
    getAudioTrackRaw(trackId) {
        const trackMeta = this.soundMeta[trackId];
        return new Uint8Array(this.buffer, trackMeta.offset, trackMeta.length);
    }
    decodeAudioTrack(trackId) {
        const adpcm = this.getAudioTrackRaw(trackId);
        const output = new Int16Array(16364 * 60);
        let outputOffset = 0;
        // initial decoder state
        let prevDiff = 0;
        let prevStepIndex = 40;
        let sample;
        let diff;
        let stepIndex;
        // loop through each byte in the raw adpcm data
        for (let adpcmOffset = 0; adpcmOffset < adpcm.length; adpcmOffset++) {
            const byte = adpcm[adpcmOffset];
            let bitPos = 0;
            while (bitPos < 8) {
                if (prevStepIndex < 18 || bitPos == 6) {
                    // isolate 2-bit sample
                    sample = (byte >> bitPos) & 0x3;
                    // get diff
                    diff = prevDiff + ADPCM_SAMPLE_TABLE_2BIT[sample + 4 * prevStepIndex];
                    // get step index
                    stepIndex = prevStepIndex + ADPCM_INDEX_TABLE_2BIT[sample];
                    bitPos += 2;
                }
                else {
                    // isolate 4-bit sample
                    sample = (byte >> bitPos) & 0xF;
                    // get diff
                    diff = prevDiff + ADPCM_SAMPLE_TABLE_4BIT[sample + 16 * prevStepIndex];
                    // get step index
                    stepIndex = prevStepIndex + ADPCM_INDEX_TABLE_4BIT[sample];
                    bitPos += 4;
                }
                // clamp step index and diff
                stepIndex = clamp(stepIndex, 0, 79);
                diff = clamp(diff, -2047, 2047);
                // add result to output buffer
                output[outputOffset] = (diff * 16);
                outputOffset += 1;
                // set prev decoder state
                prevStepIndex = stepIndex;
                prevDiff = diff;
            }
        }
        return output.slice(0, outputOffset);
    }
    getAudioTrackPcm(trackId, dstFreq = CTR_SAMPLE_RATE) {
        const srcPcm = this.decodeAudioTrack(trackId);
        let srcFreq = this.rawSampleRate;
        if (trackId === FlipnoteAudioTrack.BGM) {
            const bgmAdjust = (1 / this.bgmrate) / (1 / this.framerate);
            srcFreq = this.rawSampleRate * bgmAdjust;
        }
        if (srcFreq !== dstFreq) {
            return pcmDsAudioResample(srcPcm, srcFreq, dstFreq);
        }
        return srcPcm;
    }
    getAudioMasterPcm(dstFreq = CTR_SAMPLE_RATE) {
        const duration = this.frameCount * (1 / this.framerate);
        const dstSize = Math.floor(duration * dstFreq);
        const master = new Int16Array(dstSize);
        const hasBgm = this.hasAudioTrack(FlipnoteAudioTrack.BGM);
        const hasSe1 = this.hasAudioTrack(FlipnoteAudioTrack.SE1);
        const hasSe2 = this.hasAudioTrack(FlipnoteAudioTrack.SE2);
        const hasSe3 = this.hasAudioTrack(FlipnoteAudioTrack.SE3);
        const hasSe4 = this.hasAudioTrack(FlipnoteAudioTrack.SE4);
        // Mix background music
        if (hasBgm) {
            const bgmPcm = this.getAudioTrackPcm(FlipnoteAudioTrack.BGM, dstFreq);
            pcmAudioMix(bgmPcm, master, 0);
        }
        // Mix sound effects
        if (hasSe1 || hasSe2 || hasSe3) {
            const samplesPerFrame = Math.floor(dstFreq / this.framerate);
            const seFlags = this.decodeSoundFlags();
            const se1Pcm = hasSe1 ? this.getAudioTrackPcm(FlipnoteAudioTrack.SE1, dstFreq) : null;
            const se2Pcm = hasSe2 ? this.getAudioTrackPcm(FlipnoteAudioTrack.SE2, dstFreq) : null;
            const se3Pcm = hasSe3 ? this.getAudioTrackPcm(FlipnoteAudioTrack.SE3, dstFreq) : null;
            const se4Pcm = hasSe4 ? this.getAudioTrackPcm(FlipnoteAudioTrack.SE4, dstFreq) : null;
            for (let i = 0; i < this.frameCount; i++) {
                const seOffset = samplesPerFrame * i;
                const flag = seFlags[i];
                if (hasSe1 && flag[0])
                    pcmAudioMix(se1Pcm, master, seOffset);
                if (hasSe2 && flag[1])
                    pcmAudioMix(se2Pcm, master, seOffset);
                if (hasSe3 && flag[2])
                    pcmAudioMix(se3Pcm, master, seOffset);
                if (hasSe4 && flag[3])
                    pcmAudioMix(se4Pcm, master, seOffset);
            }
        }
        return master;
    }
}
KwzParser.type = 'KWZ';
KwzParser.width = 320;
KwzParser.height = 240;
KwzParser.rawSampleRate = 16364;
// TODO: check this is true, it probably isnt
KwzParser.sampleRate = CTR_SAMPLE_RATE;
KwzParser.globalPalette = [
    PALETTE$1.WHITE,
    PALETTE$1.BLACK,
    PALETTE$1.RED,
    PALETTE$1.YELLOW,
    PALETTE$1.GREEN,
    PALETTE$1.BLUE,
    PALETTE$1.NONE,
];

function parseSource(source) {
    return loadSource(source)
        .then((arrayBuffer) => {
        return new Promise((resolve, reject) => {
            // check the buffer's magic to identify which format it uses
            const magicBytes = new Uint8Array(arrayBuffer.slice(0, 4));
            const magic = (magicBytes[0] << 24) | (magicBytes[1] << 16) | (magicBytes[2] << 8) | magicBytes[3];
            // check if magic is PARA (ppm magic)
            if (magic === 0x50415241)
                resolve(new PpmParser(arrayBuffer));
            // check if magic is KFH (kwz magic)
            else if ((magic & 0xFFFFFF00) === 0x4B464800)
                resolve(new KwzParser(arrayBuffer));
            else
                reject();
        });
    });
}

/*
  LZWEncoder.js

  Authors
  Kevin Weiner (original Java version - kweiner@fmsware.com)
  Thibault Imbert (AS3 version - bytearray.org)
  Johan Nordberg (JS version - code@johan-nordberg.com)
  James Daniel (ES6/TS version)

  Acknowledgements
  GIFCOMPR.C - GIF Image compression routines
  Lempel-Ziv compression based on 'compress'. GIF modifications by
  David Rowley (mgardi@watdcsu.waterloo.edu)
  GIF Image compression - modified 'compress'
  Based on: compress.c - File compression ala IEEE Computer, June 1984.
  By Authors: Spencer W. Thomas (decvax!harpo!utah-cs!utah-gr!thomas)
  Jim McKie (decvax!mcvax!jim)
  Steve Davies (decvax!vax135!petsd!peora!srd)
  Ken Turkowski (decvax!decwrl!turtlevax!ken)
  James A. Woods (decvax!ihnp4!ames!jaw)
  Joe Orost (decvax!vax135!petsd!joe)
*/
const EOF = -1;
const BITS = 12;
const HSIZE = 5003; // 80% occupancy
const masks = [
    0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F,
    0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF,
    0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF
];
class LZWEncoder {
    constructor(width, height, pixels, colorDepth) {
        this.accum = new Uint8Array(256);
        this.htab = new Int32Array(HSIZE);
        this.codetab = new Int32Array(HSIZE);
        this.cur_accum = 0;
        this.cur_bits = 0;
        this.curPixel = 0;
        this.free_ent = 0; // first unused entry
        // block compression parameters -- after all codes are used up,
        // and compression rate changes, start over.
        this.clear_flg = false;
        // Algorithm: use open addressing double hashing (no chaining) on the
        // prefix code / next character combination. We do a variant of Knuth's
        // algorithm D (vol. 3, sec. 6.4) along with G. Knott's relatively-prime
        // secondary probe. Here, the modular division first probe is gives way
        // to a faster exclusive-or manipulation. Also do block compression with
        // an adaptive reset, whereby the code table is cleared when the compression
        // ratio decreases, but after the table fills. The variable-length output
        // codes are re-sized at this point, and a special CLEAR code is generated
        // for the decompressor. Late addition: construct the table according to
        // file size for noticeable speed improvement on small files. Please direct
        // questions about this implementation to ames!jaw.
        this.g_init_bits = undefined;
        this.ClearCode = undefined;
        this.EOFCode = undefined;
        this.width = width;
        this.height = height;
        this.pixels = pixels;
        this.colorDepth = colorDepth;
        this.initCodeSize = Math.max(2, this.colorDepth);
        this.accum = new Uint8Array(256);
        this.htab = new Int32Array(HSIZE);
        this.codetab = new Int32Array(HSIZE);
        this.cur_accum = 0;
        this.cur_bits = 0;
        this.a_count;
        this.remaining;
        this.curPixel = 0;
        this.free_ent = 0; // first unused entry
        this.maxcode;
        // block compression parameters -- after all codes are used up,
        // and compression rate changes, start over.
        this.clear_flg = false;
        // Algorithm: use open addressing double hashing (no chaining) on the
        // prefix code / next character combination. We do a variant of Knuth's
        // algorithm D (vol. 3, sec. 6.4) along with G. Knott's relatively-prime
        // secondary probe. Here, the modular division first probe is gives way
        // to a faster exclusive-or manipulation. Also do block compression with
        // an adaptive reset, whereby the code table is cleared when the compression
        // ratio decreases, but after the table fills. The variable-length output
        // codes are re-sized at this point, and a special CLEAR code is generated
        // for the decompressor. Late addition: construct the table according to
        // file size for noticeable speed improvement on small files. Please direct
        // questions about this implementation to ames!jaw.
        this.g_init_bits = undefined;
        this.ClearCode = undefined;
        this.EOFCode = undefined;
    }
    // Add a character to the end of the current packet, and if it is 254
    // characters, flush the packet to disk.
    char_out(c, outs) {
        this.accum[this.a_count++] = c;
        if (this.a_count >= 254)
            this.flush_char(outs);
    }
    // Clear out the hash table
    // table clear for block compress
    cl_block(outs) {
        this.cl_hash(HSIZE);
        this.free_ent = this.ClearCode + 2;
        this.clear_flg = true;
        this.output(this.ClearCode, outs);
    }
    // Reset code table
    cl_hash(hsize) {
        for (var i = 0; i < hsize; ++i)
            this.htab[i] = -1;
    }
    compress(init_bits, outs) {
        var fcode, c, i, ent, disp, hsize_reg, hshift;
        // Set up the globals: this.g_init_bits - initial number of bits
        this.g_init_bits = init_bits;
        // Set up the necessary values
        this.clear_flg = false;
        this.n_bits = this.g_init_bits;
        this.maxcode = this.get_maxcode(this.n_bits);
        this.ClearCode = 1 << (init_bits - 1);
        this.EOFCode = this.ClearCode + 1;
        this.free_ent = this.ClearCode + 2;
        this.a_count = 0; // clear packet
        ent = this.nextPixel();
        hshift = 0;
        for (fcode = HSIZE; fcode < 65536; fcode *= 2)
            ++hshift;
        hshift = 8 - hshift; // set hash code range bound
        hsize_reg = HSIZE;
        this.cl_hash(hsize_reg); // clear hash table
        this.output(this.ClearCode, outs);
        outer_loop: while ((c = this.nextPixel()) != EOF) {
            fcode = (c << BITS) + ent;
            i = (c << hshift) ^ ent; // xor hashing
            if (this.htab[i] === fcode) {
                ent = this.codetab[i];
                continue;
            }
            else if (this.htab[i] >= 0) { // non-empty slot
                disp = hsize_reg - i; // secondary hash (after G. Knott)
                if (i === 0)
                    disp = 1;
                do {
                    if ((i -= disp) < 0)
                        i += hsize_reg;
                    if (this.htab[i] === fcode) {
                        ent = this.codetab[i];
                        continue outer_loop;
                    }
                } while (this.htab[i] >= 0);
            }
            this.output(ent, outs);
            ent = c;
            if (this.free_ent < 1 << BITS) {
                this.codetab[i] = this.free_ent++; // code -> hasthis.htable
                this.htab[i] = fcode;
            }
            else {
                this.cl_block(outs);
            }
        }
        // Put out the final code.
        this.output(ent, outs);
        this.output(this.EOFCode, outs);
    }
    encode(outs) {
        outs.writeByte(this.initCodeSize); // write 'initial code size' byte
        this.remaining = this.width * this.height; // reset navigation variables
        this.curPixel = 0;
        this.compress(this.initCodeSize + 1, outs); // compress and write the pixel data
        outs.writeByte(0); // write block terminator
    }
    // Flush the packet to disk, and reset the this.accumulator
    flush_char(outs) {
        if (this.a_count > 0) {
            outs.writeByte(this.a_count);
            outs.writeBytes(this.accum, 0, this.a_count);
            this.a_count = 0;
        }
    }
    get_maxcode(n_bits) {
        return (1 << n_bits) - 1;
    }
    // Return the next pixel from the image
    nextPixel() {
        if (this.remaining === 0)
            return EOF;
        --this.remaining;
        var pix = this.pixels[this.curPixel++];
        return pix & 0xff;
    }
    output(code, outs) {
        this.cur_accum &= masks[this.cur_bits];
        if (this.cur_bits > 0)
            this.cur_accum |= (code << this.cur_bits);
        else
            this.cur_accum = code;
        this.cur_bits += this.n_bits;
        while (this.cur_bits >= 8) {
            this.char_out((this.cur_accum & 0xff), outs);
            this.cur_accum >>= 8;
            this.cur_bits -= 8;
        }
        // If the next entry is going to be too big for the code size,
        // then increase it, if possible.
        if (this.free_ent > this.maxcode || this.clear_flg) {
            if (this.clear_flg) {
                this.maxcode = this.get_maxcode(this.n_bits = this.g_init_bits);
                this.clear_flg = false;
            }
            else {
                ++this.n_bits;
                if (this.n_bits == BITS)
                    this.maxcode = 1 << BITS;
                else
                    this.maxcode = this.get_maxcode(this.n_bits);
            }
        }
        if (code == this.EOFCode) {
            // At EOF, write the rest of the buffer.
            while (this.cur_bits > 0) {
                this.char_out((this.cur_accum & 0xff), outs);
                this.cur_accum >>= 8;
                this.cur_bits -= 8;
            }
            this.flush_char(outs);
        }
    }
}

class GifEncoder {
    constructor(width, height, meta = {}) {
        this.palette = [];
        this.width = width;
        this.height = height;
        this.data = new ByteArray();
        this.meta = { ...GifEncoder.defaultMeta, ...meta };
    }
    static fromFlipnote(flipnote, gifMeta = {}) {
        const gif = new GifEncoder(flipnote.width, flipnote.height, {
            delay: 100 / flipnote.framerate,
            repeat: flipnote.meta.loop ? -1 : 0,
            ...gifMeta
        });
        gif.palette = flipnote.globalPalette;
        gif.init();
        for (let frameIndex = 0; frameIndex < flipnote.frameCount; frameIndex++) {
            gif.writeFrame(flipnote.getFramePixels(frameIndex));
        }
        return gif;
    }
    static fromFlipnoteFrame(flipnote, frameIndex, gifMeta = {}) {
        const gif = new GifEncoder(flipnote.width, flipnote.height, {
            // TODO: look at ideal delay and repeat settings for single frame GIF
            delay: 100 / flipnote.framerate,
            repeat: -1,
            ...gifMeta,
        });
        gif.palette = flipnote.globalPalette;
        gif.init();
        gif.writeFrame(flipnote.getFramePixels(frameIndex));
        return gif;
    }
    init() {
        const paletteSize = this.palette.length;
        // calc colorDepth
        for (var p = 1; 1 << p < paletteSize; p += 1)
            continue;
        this.meta.colorDepth = p;
        this.writeHeader();
        this.writeColorTable();
        this.writeNetscapeExt();
    }
    writeHeader() {
        const header = new DataStream(new ArrayBuffer(13));
        header.writeChars('GIF89a');
        // Logical Screen Descriptor
        header.writeUint16(this.width);
        header.writeUint16(this.height);
        header.writeUint8(0x80 | // 1 : global color table flag = 1 (gct used)
            (this.meta.colorDepth - 1) // 6-8 : gct size
        );
        header.writeBytes([
            0x0,
            0x0
        ]);
        this.data.writeBytes(new Uint8Array(header.buffer));
    }
    writeColorTable() {
        const palette = new Uint8Array(3 * Math.pow(2, this.meta.colorDepth));
        let offset = 0;
        for (let index = 0; index < this.palette.length; index += 1) {
            const [r, g, b, a] = this.palette[index];
            palette[offset++] = r;
            palette[offset++] = g;
            palette[offset++] = b;
        }
        this.data.writeBytes(palette);
    }
    writeGraphicsControlExt() {
        const graphicsControlExt = new DataStream(new ArrayBuffer(8));
        const transparentFlag = this.meta.transparentBg ? 0x1 : 0x0;
        graphicsControlExt.writeBytes([
            0x21,
            0xF9,
            0x4,
            0x0 | transparentFlag // bitflags
        ]);
        graphicsControlExt.writeUint16(this.meta.delay); // loop flag
        graphicsControlExt.writeBytes([
            0x0,
            0x0
        ]);
        this.data.writeBytes(new Uint8Array(graphicsControlExt.buffer));
    }
    writeNetscapeExt() {
        const netscapeExt = new DataStream(new ArrayBuffer(19));
        netscapeExt.writeBytes([
            0x21,
            0xFF,
            11,
        ]);
        netscapeExt.writeChars('NETSCAPE2.0');
        netscapeExt.writeUint8(3); // subblock size
        netscapeExt.writeUint8(1); // loop subblock id
        netscapeExt.writeUint16(this.meta.repeat); // loop flag
        this.data.writeBytes(new Uint8Array(netscapeExt.buffer));
    }
    writeImageDesc() {
        const desc = new DataStream(new ArrayBuffer(10));
        desc.writeUint8(0x2C);
        desc.writeUint16(0); // image left
        desc.writeUint16(0); // image top
        desc.writeUint16(this.width);
        desc.writeUint16(this.height);
        desc.writeUint8(0);
        this.data.writeBytes(new Uint8Array(desc.buffer));
    }
    writePixels(pixels) {
        const lzw = new LZWEncoder(this.width, this.height, pixels, this.meta.colorDepth);
        lzw.encode(this.data);
    }
    writeFrame(pixels) {
        this.writeGraphicsControlExt();
        this.writeImageDesc();
        this.writePixels(pixels);
    }
    getBuffer() {
        return this.data.getBuffer();
    }
    getBlob() {
        return new Blob([this.getBuffer()], { type: 'image/gif' });
    }
    getUrl() {
        return window.URL.createObjectURL(this.getBlob());
    }
    getImage() {
        const img = new Image(this.width, this.height);
        img.src = this.getUrl();
        return img;
    }
}
GifEncoder.defaultMeta = {
    transparentBg: false,
    delay: 100,
    repeat: -1,
    colorDepth: 8
};

class WavEncoder {
    constructor(sampleRate, channels = 1, bitsPerSample = 16) {
        this.sampleRate = sampleRate;
        this.channels = channels;
        this.bitsPerSample = bitsPerSample;
        // Write WAV file header
        // Reference: http://www.topherlee.com/software/pcm-tut-wavformat.html
        let headerBuffer = new ArrayBuffer(44);
        let header = new DataStream(headerBuffer);
        // 'RIFF' indent
        header.writeChars('RIFF');
        // filesize (set later)
        header.writeUint32(0);
        // 'WAVE' indent
        header.writeChars('WAVE');
        // 'fmt ' section header
        header.writeChars('fmt ');
        // fmt section length
        header.writeUint32(16);
        // specify audio format is pcm (type 1)
        header.writeUint16(1);
        // number of audio channels
        header.writeUint16(this.channels);
        // audio sample rate
        header.writeUint32(this.sampleRate);
        // byterate = (sampleRate * bitsPerSample * channelCount) / 8
        header.writeUint32((this.sampleRate * this.bitsPerSample * this.channels) / 8);
        // blockalign = (bitsPerSample * channels) / 8
        header.writeUint16((this.bitsPerSample * this.channels) / 8);
        // bits per sample
        header.writeUint16(this.bitsPerSample);
        // 'data' section header
        header.writeChars('data');
        // data section length (set later)
        header.writeUint32(0);
        this.header = header;
        this.pcmData = null;
    }
    static fromFlipnote(note) {
        const sampleRate = note.sampleRate;
        const wav = new WavEncoder(sampleRate, 1, 16);
        const pcm = note.getAudioMasterPcm(sampleRate);
        wav.writeFrames(pcm);
        return wav;
    }
    static fromFlipnoteTrack(note, trackId) {
        const sampleRate = note.sampleRate;
        const wav = new WavEncoder(sampleRate, 1, 16);
        const pcm = note.getAudioTrackPcm(trackId, sampleRate);
        wav.writeFrames(pcm);
        return wav;
    }
    writeFrames(pcmData) {
        let header = this.header;
        // fill in filesize
        header.seek(4);
        header.writeUint32(header.byteLength + pcmData.byteLength);
        // fill in data section length
        header.seek(40);
        header.writeUint32(pcmData.byteLength);
        this.pcmData = pcmData;
    }
    getBlob() {
        return new Blob([this.header.buffer, this.pcmData.buffer], { type: 'audio/wav' });
    }
}

/* @license twgl.js 4.15.2 Copyright (c) 2015, Gregg Tavares All Rights Reserved.
Available via the MIT license.
see: http://github.com/greggman/twgl.js for details */

/*
 * Copyright 2019 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/* DataType */
const BYTE                           = 0x1400;
const UNSIGNED_BYTE                  = 0x1401;
const SHORT                          = 0x1402;
const UNSIGNED_SHORT                 = 0x1403;
const INT                            = 0x1404;
const UNSIGNED_INT                   = 0x1405;
const FLOAT                          = 0x1406;

/**
 * Get the GL type for a typedArray
 * @param {ArrayBufferView} typedArray a typedArray
 * @return {number} the GL type for array. For example pass in an `Int8Array` and `gl.BYTE` will
 *   be returned. Pass in a `Uint32Array` and `gl.UNSIGNED_INT` will be returned
 * @memberOf module:twgl/typedArray
 */
function getGLTypeForTypedArray(typedArray) {
  if (typedArray instanceof Int8Array)         { return BYTE; }           // eslint-disable-line
  if (typedArray instanceof Uint8Array)        { return UNSIGNED_BYTE; }  // eslint-disable-line
  if (typedArray instanceof Uint8ClampedArray) { return UNSIGNED_BYTE; }  // eslint-disable-line
  if (typedArray instanceof Int16Array)        { return SHORT; }          // eslint-disable-line
  if (typedArray instanceof Uint16Array)       { return UNSIGNED_SHORT; } // eslint-disable-line
  if (typedArray instanceof Int32Array)        { return INT; }            // eslint-disable-line
  if (typedArray instanceof Uint32Array)       { return UNSIGNED_INT; }   // eslint-disable-line
  if (typedArray instanceof Float32Array)      { return FLOAT; }          // eslint-disable-line
  throw new Error('unsupported typed array type');
}

/**
 * Get the GL type for a typedArray type
 * @param {ArrayBufferView} typedArrayType a typedArray constructor
 * @return {number} the GL type for type. For example pass in `Int8Array` and `gl.BYTE` will
 *   be returned. Pass in `Uint32Array` and `gl.UNSIGNED_INT` will be returned
 * @memberOf module:twgl/typedArray
 */
function getGLTypeForTypedArrayType(typedArrayType) {
  if (typedArrayType === Int8Array)         { return BYTE; }           // eslint-disable-line
  if (typedArrayType === Uint8Array)        { return UNSIGNED_BYTE; }  // eslint-disable-line
  if (typedArrayType === Uint8ClampedArray) { return UNSIGNED_BYTE; }  // eslint-disable-line
  if (typedArrayType === Int16Array)        { return SHORT; }          // eslint-disable-line
  if (typedArrayType === Uint16Array)       { return UNSIGNED_SHORT; } // eslint-disable-line
  if (typedArrayType === Int32Array)        { return INT; }            // eslint-disable-line
  if (typedArrayType === Uint32Array)       { return UNSIGNED_INT; }   // eslint-disable-line
  if (typedArrayType === Float32Array)      { return FLOAT; }          // eslint-disable-line
  throw new Error('unsupported typed array type');
}

const isArrayBuffer = typeof SharedArrayBuffer !== 'undefined'
  ? function isArrayBufferOrSharedArrayBuffer(a) {
    return a && a.buffer && (a.buffer instanceof ArrayBuffer || a.buffer instanceof SharedArrayBuffer);
  }
  : function isArrayBuffer(a) {
    return a && a.buffer && a.buffer instanceof ArrayBuffer;
  };

function isBuffer(gl, t) {
  return typeof WebGLBuffer !== 'undefined' && t instanceof WebGLBuffer;
}

function isTexture(gl, t) {
  return typeof WebGLTexture !== 'undefined' && t instanceof WebGLTexture;
}

/*
 * Copyright 2019 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

const STATIC_DRAW                  = 0x88e4;
const ARRAY_BUFFER                 = 0x8892;
const ELEMENT_ARRAY_BUFFER         = 0x8893;
const BUFFER_SIZE                  = 0x8764;

const BYTE$1                         = 0x1400;
const UNSIGNED_BYTE$1                = 0x1401;
const SHORT$1                        = 0x1402;
const UNSIGNED_SHORT$1               = 0x1403;
const INT$1                          = 0x1404;
const UNSIGNED_INT$1                 = 0x1405;
const FLOAT$1                        = 0x1406;
const defaults = {
  attribPrefix: "",
};

function setBufferFromTypedArray(gl, type, buffer, array, drawType) {
  gl.bindBuffer(type, buffer);
  gl.bufferData(type, array, drawType || STATIC_DRAW);
}

/**
 * Given typed array creates a WebGLBuffer and copies the typed array
 * into it.
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext
 * @param {ArrayBuffer|SharedArrayBuffer|ArrayBufferView|WebGLBuffer} typedArray the typed array. Note: If a WebGLBuffer is passed in it will just be returned. No action will be taken
 * @param {number} [type] the GL bind type for the buffer. Default = `gl.ARRAY_BUFFER`.
 * @param {number} [drawType] the GL draw type for the buffer. Default = 'gl.STATIC_DRAW`.
 * @return {WebGLBuffer} the created WebGLBuffer
 * @memberOf module:twgl/attributes
 */
function createBufferFromTypedArray(gl, typedArray, type, drawType) {
  if (isBuffer(gl, typedArray)) {
    return typedArray;
  }
  type = type || ARRAY_BUFFER;
  const buffer = gl.createBuffer();
  setBufferFromTypedArray(gl, type, buffer, typedArray, drawType);
  return buffer;
}

function isIndices(name) {
  return name === "indices";
}

// This is really just a guess. Though I can't really imagine using
// anything else? Maybe for some compression?
function getNormalizationForTypedArray(typedArray) {
  if (typedArray instanceof Int8Array)    { return true; }  // eslint-disable-line
  if (typedArray instanceof Uint8Array)   { return true; }  // eslint-disable-line
  return false;
}

// This is really just a guess. Though I can't really imagine using
// anything else? Maybe for some compression?
function getNormalizationForTypedArrayType(typedArrayType) {
  if (typedArrayType === Int8Array)    { return true; }  // eslint-disable-line
  if (typedArrayType === Uint8Array)   { return true; }  // eslint-disable-line
  return false;
}

function getArray(array) {
  return array.length ? array : array.data;
}

const texcoordRE = /coord|texture/i;
const colorRE = /color|colour/i;

function guessNumComponentsFromName(name, length) {
  let numComponents;
  if (texcoordRE.test(name)) {
    numComponents = 2;
  } else if (colorRE.test(name)) {
    numComponents = 4;
  } else {
    numComponents = 3;  // position, normals, indices ...
  }

  if (length % numComponents > 0) {
    throw new Error(`Can not guess numComponents for attribute '${name}'. Tried ${numComponents} but ${length} values is not evenly divisible by ${numComponents}. You should specify it.`);
  }

  return numComponents;
}

function getNumComponents(array, arrayName) {
  return array.numComponents || array.size || guessNumComponentsFromName(arrayName, getArray(array).length);
}

function makeTypedArray(array, name) {
  if (isArrayBuffer(array)) {
    return array;
  }

  if (isArrayBuffer(array.data)) {
    return array.data;
  }

  if (Array.isArray(array)) {
    array = {
      data: array,
    };
  }

  let Type = array.type;
  if (!Type) {
    if (isIndices(name)) {
      Type = Uint16Array;
    } else {
      Type = Float32Array;
    }
  }
  return new Type(array.data);
}

/**
 * The info for an attribute. This is effectively just the arguments to `gl.vertexAttribPointer` plus the WebGLBuffer
 * for the attribute.
 *
 * @typedef {Object} AttribInfo
 * @property {number[]|ArrayBufferView} [value] a constant value for the attribute. Note: if this is set the attribute will be
 *    disabled and set to this constant value and all other values will be ignored.
 * @property {number} [numComponents] the number of components for this attribute.
 * @property {number} [size] synonym for `numComponents`.
 * @property {number} [type] the type of the attribute (eg. `gl.FLOAT`, `gl.UNSIGNED_BYTE`, etc...) Default = `gl.FLOAT`
 * @property {boolean} [normalize] whether or not to normalize the data. Default = false
 * @property {number} [offset] offset into buffer in bytes. Default = 0
 * @property {number} [stride] the stride in bytes per element. Default = 0
 * @property {number} [divisor] the divisor in instances. Default = undefined. Note: undefined = don't call gl.vertexAttribDivisor
 *    where as anything else = do call it with this value
 * @property {WebGLBuffer} buffer the buffer that contains the data for this attribute
 * @property {number} [drawType] the draw type passed to gl.bufferData. Default = gl.STATIC_DRAW
 * @memberOf module:twgl
 */

/**
 * Use this type of array spec when TWGL can't guess the type or number of components of an array
 * @typedef {Object} FullArraySpec
 * @property {number[]|ArrayBufferView} [value] a constant value for the attribute. Note: if this is set the attribute will be
 *    disabled and set to this constant value and all other values will be ignored.
 * @property {(number|number[]|ArrayBufferView)} data The data of the array. A number alone becomes the number of elements of type.
 * @property {number} [numComponents] number of components for `vertexAttribPointer`. Default is based on the name of the array.
 *    If `coord` is in the name assumes `numComponents = 2`.
 *    If `color` is in the name assumes `numComponents = 4`.
 *    otherwise assumes `numComponents = 3`
 * @property {constructor} [type] type. This is only used if `data` is a JavaScript array. It is the constructor for the typedarray. (eg. `Uint8Array`).
 * For example if you want colors in a `Uint8Array` you might have a `FullArraySpec` like `{ type: Uint8Array, data: [255,0,255,255, ...], }`.
 * @property {number} [size] synonym for `numComponents`.
 * @property {boolean} [normalize] normalize for `vertexAttribPointer`. Default is true if type is `Int8Array` or `Uint8Array` otherwise false.
 * @property {number} [stride] stride for `vertexAttribPointer`. Default = 0
 * @property {number} [offset] offset for `vertexAttribPointer`. Default = 0
 * @property {number} [divisor] divisor for `vertexAttribDivisor`. Default = undefined. Note: undefined = don't call gl.vertexAttribDivisor
 *    where as anything else = do call it with this value
 * @property {string} [attrib] name of attribute this array maps to. Defaults to same name as array prefixed by the default attribPrefix.
 * @property {string} [name] synonym for `attrib`.
 * @property {string} [attribName] synonym for `attrib`.
 * @property {WebGLBuffer} [buffer] Buffer to use for this attribute. This lets you use your own buffer
 *    but you will need to supply `numComponents` and `type`. You can effectively pass an `AttribInfo`
 *    to provide this. Example:
 *
 *         const bufferInfo1 = twgl.createBufferInfoFromArrays(gl, {
 *           position: [1, 2, 3, ... ],
 *         });
 *         const bufferInfo2 = twgl.createBufferInfoFromArrays(gl, {
 *           position: bufferInfo1.attribs.position,  // use the same buffer from bufferInfo1
 *         });
 *
 * @memberOf module:twgl
 */

/**
 * An individual array in {@link module:twgl.Arrays}
 *
 * When passed to {@link module:twgl.createBufferInfoFromArrays} if an ArraySpec is `number[]` or `ArrayBufferView`
 * the types will be guessed based on the name. `indices` will be `Uint16Array`, everything else will
 * be `Float32Array`. If an ArraySpec is a number it's the number of floats for an empty (zeroed) buffer.
 *
 * @typedef {(number|number[]|ArrayBufferView|module:twgl.FullArraySpec)} ArraySpec
 * @memberOf module:twgl
 */

/**
 * This is a JavaScript object of arrays by name. The names should match your shader's attributes. If your
 * attributes have a common prefix you can specify it by calling {@link module:twgl.setAttributePrefix}.
 *
 *     Bare JavaScript Arrays
 *
 *         var arrays = {
 *            position: [-1, 1, 0],
 *            normal: [0, 1, 0],
 *            ...
 *         }
 *
 *     Bare TypedArrays
 *
 *         var arrays = {
 *            position: new Float32Array([-1, 1, 0]),
 *            color: new Uint8Array([255, 128, 64, 255]),
 *            ...
 *         }
 *
 * *   Will guess at `numComponents` if not specified based on name.
 *
 *     If `coord` is in the name assumes `numComponents = 2`
 *
 *     If `color` is in the name assumes `numComponents = 4`
 *
 *     otherwise assumes `numComponents = 3`
 *
 * Objects with various fields. See {@link module:twgl.FullArraySpec}.
 *
 *     var arrays = {
 *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
 *       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
 *       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
 *       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
 *     };
 *
 * @typedef {Object.<string, module:twgl.ArraySpec>} Arrays
 * @memberOf module:twgl
 */


/**
 * Creates a set of attribute data and WebGLBuffers from set of arrays
 *
 * Given
 *
 *      var arrays = {
 *        position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
 *        texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
 *        normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
 *        color:    { numComponents: 4, data: [255, 255, 255, 255, 255, 0, 0, 255, 0, 0, 255, 255], type: Uint8Array, },
 *        indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
 *      };
 *
 * returns something like
 *
 *      var attribs = {
 *        position: { numComponents: 3, type: gl.FLOAT,         normalize: false, buffer: WebGLBuffer, },
 *        texcoord: { numComponents: 2, type: gl.FLOAT,         normalize: false, buffer: WebGLBuffer, },
 *        normal:   { numComponents: 3, type: gl.FLOAT,         normalize: false, buffer: WebGLBuffer, },
 *        color:    { numComponents: 4, type: gl.UNSIGNED_BYTE, normalize: true,  buffer: WebGLBuffer, },
 *      };
 *
 * notes:
 *
 * *   Arrays can take various forms
 *
 *     Bare JavaScript Arrays
 *
 *         var arrays = {
 *            position: [-1, 1, 0],
 *            normal: [0, 1, 0],
 *            ...
 *         }
 *
 *     Bare TypedArrays
 *
 *         var arrays = {
 *            position: new Float32Array([-1, 1, 0]),
 *            color: new Uint8Array([255, 128, 64, 255]),
 *            ...
 *         }
 *
 * *   Will guess at `numComponents` if not specified based on name.
 *
 *     If `coord` is in the name assumes `numComponents = 2`
 *
 *     If `color` is in the name assumes `numComponents = 4`
 *
 *     otherwise assumes `numComponents = 3`
 *
 * @param {WebGLRenderingContext} gl The webgl rendering context.
 * @param {module:twgl.Arrays} arrays The arrays
 * @param {module:twgl.BufferInfo} [srcBufferInfo] a BufferInfo to copy from
 *   This lets you share buffers. Any arrays you supply will override
 *   the buffers from srcBufferInfo.
 * @return {Object.<string, module:twgl.AttribInfo>} the attribs
 * @memberOf module:twgl/attributes
 */
function createAttribsFromArrays(gl, arrays) {
  const attribs = {};
  Object.keys(arrays).forEach(function(arrayName) {
    if (!isIndices(arrayName)) {
      const array = arrays[arrayName];
      const attribName = array.attrib || array.name || array.attribName || (defaults.attribPrefix + arrayName);
      if (array.value) {
        if (!Array.isArray(array.value) && !isArrayBuffer(array.value)) {
          throw new Error('array.value is not array or typedarray');
        }
        attribs[attribName] = {
          value: array.value,
        };
      } else {
        let buffer;
        let type;
        let normalization;
        let numComponents;
        if (array.buffer && array.buffer instanceof WebGLBuffer) {
          buffer = array.buffer;
          numComponents = array.numComponents || array.size;
          type = array.type;
          normalization = array.normalize;
        } else if (typeof array === "number" || typeof array.data === "number") {
          const numValues = array.data || array;
          const arrayType = array.type || Float32Array;
          const numBytes = numValues * arrayType.BYTES_PER_ELEMENT;
          type = getGLTypeForTypedArrayType(arrayType);
          normalization = array.normalize !== undefined ? array.normalize : getNormalizationForTypedArrayType(arrayType);
          numComponents = array.numComponents || array.size || guessNumComponentsFromName(arrayName, numValues);
          buffer = gl.createBuffer();
          gl.bindBuffer(ARRAY_BUFFER, buffer);
          gl.bufferData(ARRAY_BUFFER, numBytes, array.drawType || STATIC_DRAW);
        } else {
          const typedArray = makeTypedArray(array, arrayName);
          buffer = createBufferFromTypedArray(gl, typedArray, undefined, array.drawType);
          type = getGLTypeForTypedArray(typedArray);
          normalization = array.normalize !== undefined ? array.normalize : getNormalizationForTypedArray(typedArray);
          numComponents = getNumComponents(array, arrayName);
        }
        attribs[attribName] = {
          buffer:        buffer,
          numComponents: numComponents,
          type:          type,
          normalize:     normalization,
          stride:        array.stride || 0,
          offset:        array.offset || 0,
          divisor:       array.divisor === undefined ? undefined : array.divisor,
          drawType:      array.drawType,
        };
      }
    }
  });
  gl.bindBuffer(ARRAY_BUFFER, null);
  return attribs;
}

function getBytesPerValueForGLType(gl, type) {
  if (type === BYTE$1)           return 1;  // eslint-disable-line
  if (type === UNSIGNED_BYTE$1)  return 1;  // eslint-disable-line
  if (type === SHORT$1)          return 2;  // eslint-disable-line
  if (type === UNSIGNED_SHORT$1) return 2;  // eslint-disable-line
  if (type === INT$1)            return 4;  // eslint-disable-line
  if (type === UNSIGNED_INT$1)   return 4;  // eslint-disable-line
  if (type === FLOAT$1)          return 4;  // eslint-disable-line
  return 0;
}

// Tries to get the number of elements from a set of arrays.
const positionKeys = ['position', 'positions', 'a_position'];

function getNumElementsFromAttributes(gl, attribs) {
  let key;
  let ii;
  for (ii = 0; ii < positionKeys.length; ++ii) {
    key = positionKeys[ii];
    if (key in attribs) {
      break;
    }
    key = defaults.attribPrefix + key;
    if (key in attribs) {
      break;
    }
  }
  if (ii === positionKeys.length) {
    key = Object.keys(attribs)[0];
  }
  const attrib = attribs[key];
  gl.bindBuffer(ARRAY_BUFFER, attrib.buffer);
  const numBytes = gl.getBufferParameter(ARRAY_BUFFER, BUFFER_SIZE);
  gl.bindBuffer(ARRAY_BUFFER, null);

  const bytesPerValue = getBytesPerValueForGLType(gl, attrib.type);
  const totalElements = numBytes / bytesPerValue;
  const numComponents = attrib.numComponents || attrib.size;
  // TODO: check stride
  const numElements = totalElements / numComponents;
  if (numElements % 1 !== 0) {
    throw new Error(`numComponents ${numComponents} not correct for length ${length}`);
  }
  return numElements;
}

/**
 * @typedef {Object} BufferInfo
 * @property {number} numElements The number of elements to pass to `gl.drawArrays` or `gl.drawElements`.
 * @property {number} [elementType] The type of indices `UNSIGNED_BYTE`, `UNSIGNED_SHORT` etc..
 * @property {WebGLBuffer} [indices] The indices `ELEMENT_ARRAY_BUFFER` if any indices exist.
 * @property {Object.<string, module:twgl.AttribInfo>} [attribs] The attribs appropriate to call `setAttributes`
 * @memberOf module:twgl
 */

/**
 * Creates a BufferInfo from an object of arrays.
 *
 * This can be passed to {@link module:twgl.setBuffersAndAttributes} and to
 * {@link module:twgl:drawBufferInfo}.
 *
 * Given an object like
 *
 *     var arrays = {
 *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
 *       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
 *       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
 *       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
 *     };
 *
 *  Creates an BufferInfo like this
 *
 *     bufferInfo = {
 *       numElements: 4,        // or whatever the number of elements is
 *       indices: WebGLBuffer,  // this property will not exist if there are no indices
 *       attribs: {
 *         position: { buffer: WebGLBuffer, numComponents: 3, },
 *         normal:   { buffer: WebGLBuffer, numComponents: 3, },
 *         texcoord: { buffer: WebGLBuffer, numComponents: 2, },
 *       },
 *     };
 *
 *  The properties of arrays can be JavaScript arrays in which case the number of components
 *  will be guessed.
 *
 *     var arrays = {
 *        position: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
 *        texcoord: [0, 0, 0, 1, 1, 0, 1, 1],
 *        normal:   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
 *        indices:  [0, 1, 2, 1, 2, 3],
 *     };
 *
 *  They can also be TypedArrays
 *
 *     var arrays = {
 *        position: new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0]),
 *        texcoord: new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]),
 *        normal:   new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
 *        indices:  new Uint16Array([0, 1, 2, 1, 2, 3]),
 *     };
 *
 *  Or AugmentedTypedArrays
 *
 *     var positions = createAugmentedTypedArray(3, 4);
 *     var texcoords = createAugmentedTypedArray(2, 4);
 *     var normals   = createAugmentedTypedArray(3, 4);
 *     var indices   = createAugmentedTypedArray(3, 2, Uint16Array);
 *
 *     positions.push([0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0]);
 *     texcoords.push([0, 0, 0, 1, 1, 0, 1, 1]);
 *     normals.push([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
 *     indices.push([0, 1, 2, 1, 2, 3]);
 *
 *     var arrays = {
 *        position: positions,
 *        texcoord: texcoords,
 *        normal:   normals,
 *        indices:  indices,
 *     };
 *
 * For the last example it is equivalent to
 *
 *     var bufferInfo = {
 *       attribs: {
 *         position: { numComponents: 3, buffer: gl.createBuffer(), },
 *         texcoord: { numComponents: 2, buffer: gl.createBuffer(), },
 *         normal: { numComponents: 3, buffer: gl.createBuffer(), },
 *       },
 *       indices: gl.createBuffer(),
 *       numElements: 6,
 *     };
 *
 *     gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.position.buffer);
 *     gl.bufferData(gl.ARRAY_BUFFER, arrays.position, gl.STATIC_DRAW);
 *     gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.texcoord.buffer);
 *     gl.bufferData(gl.ARRAY_BUFFER, arrays.texcoord, gl.STATIC_DRAW);
 *     gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.normal.buffer);
 *     gl.bufferData(gl.ARRAY_BUFFER, arrays.normal, gl.STATIC_DRAW);
 *     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices);
 *     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrays.indices, gl.STATIC_DRAW);
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext
 * @param {module:twgl.Arrays} arrays Your data
 * @param {module:twgl.BufferInfo} [srcBufferInfo] An existing
 *        buffer info to start from. WebGLBuffers etc specified
 *        in the srcBufferInfo will be used in a new BufferInfo
 *        with any arrays specified overriding the ones in
 *        srcBufferInfo.
 * @return {module:twgl.BufferInfo} A BufferInfo
 * @memberOf module:twgl/attributes
 */
function createBufferInfoFromArrays(gl, arrays, srcBufferInfo) {
  const newAttribs = createAttribsFromArrays(gl, arrays);
  const bufferInfo = Object.assign({}, srcBufferInfo ? srcBufferInfo : {});
  bufferInfo.attribs = Object.assign({}, srcBufferInfo ? srcBufferInfo.attribs : {}, newAttribs);
  const indices = arrays.indices;
  if (indices) {
    const newIndices = makeTypedArray(indices, "indices");
    bufferInfo.indices = createBufferFromTypedArray(gl, newIndices, ELEMENT_ARRAY_BUFFER);
    bufferInfo.numElements = newIndices.length;
    bufferInfo.elementType = getGLTypeForTypedArray(newIndices);
  } else if (!bufferInfo.numElements) {
    bufferInfo.numElements = getNumElementsFromAttributes(gl, bufferInfo.attribs);
  }

  return bufferInfo;
}

/*
 * Copyright 2019 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/**
 * Gets the gl version as a number
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext
 * @return {number} version of gl
 * @private
 */
//function getVersionAsNumber(gl) {
//  return parseFloat(gl.getParameter(gl."5.0.0").substr(6));
//}

/**
 * Check if context is WebGL 2.0
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext
 * @return {bool} true if it's WebGL 2.0
 * @memberOf module:twgl
 */
function isWebGL2(gl) {
  // This is the correct check but it's slow
  //  return gl.getParameter(gl."5.0.0").indexOf("WebGL 2.0") === 0;
  // This might also be the correct check but I'm assuming it's slow-ish
  // return gl instanceof WebGL2RenderingContext;
  return !!gl.texStorage2D;
}

const TEXTURE0                       = 0x84c0;

const ARRAY_BUFFER$1                   = 0x8892;
const ELEMENT_ARRAY_BUFFER$1           = 0x8893;

const ACTIVE_UNIFORMS                = 0x8b86;
const ACTIVE_ATTRIBUTES              = 0x8b89;
const TRANSFORM_FEEDBACK_VARYINGS    = 0x8c83;
const ACTIVE_UNIFORM_BLOCKS          = 0x8a36;
const UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER   = 0x8a44;
const UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER = 0x8a46;
const UNIFORM_BLOCK_DATA_SIZE                     = 0x8a40;
const UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES        = 0x8a43;

const FLOAT$3                         = 0x1406;
const FLOAT_VEC2                    = 0x8B50;
const FLOAT_VEC3                    = 0x8B51;
const FLOAT_VEC4                    = 0x8B52;
const INT$3                           = 0x1404;
const INT_VEC2                      = 0x8B53;
const INT_VEC3                      = 0x8B54;
const INT_VEC4                      = 0x8B55;
const BOOL                          = 0x8B56;
const BOOL_VEC2                     = 0x8B57;
const BOOL_VEC3                     = 0x8B58;
const BOOL_VEC4                     = 0x8B59;
const FLOAT_MAT2                    = 0x8B5A;
const FLOAT_MAT3                    = 0x8B5B;
const FLOAT_MAT4                    = 0x8B5C;
const SAMPLER_2D                    = 0x8B5E;
const SAMPLER_CUBE                  = 0x8B60;
const SAMPLER_3D                    = 0x8B5F;
const SAMPLER_2D_SHADOW             = 0x8B62;
const FLOAT_MAT2x3                  = 0x8B65;
const FLOAT_MAT2x4                  = 0x8B66;
const FLOAT_MAT3x2                  = 0x8B67;
const FLOAT_MAT3x4                  = 0x8B68;
const FLOAT_MAT4x2                  = 0x8B69;
const FLOAT_MAT4x3                  = 0x8B6A;
const SAMPLER_2D_ARRAY              = 0x8DC1;
const SAMPLER_2D_ARRAY_SHADOW       = 0x8DC4;
const SAMPLER_CUBE_SHADOW           = 0x8DC5;
const UNSIGNED_INT$3                  = 0x1405;
const UNSIGNED_INT_VEC2             = 0x8DC6;
const UNSIGNED_INT_VEC3             = 0x8DC7;
const UNSIGNED_INT_VEC4             = 0x8DC8;
const INT_SAMPLER_2D                = 0x8DCA;
const INT_SAMPLER_3D                = 0x8DCB;
const INT_SAMPLER_CUBE              = 0x8DCC;
const INT_SAMPLER_2D_ARRAY          = 0x8DCF;
const UNSIGNED_INT_SAMPLER_2D       = 0x8DD2;
const UNSIGNED_INT_SAMPLER_3D       = 0x8DD3;
const UNSIGNED_INT_SAMPLER_CUBE     = 0x8DD4;
const UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;

const TEXTURE_2D$1                    = 0x0DE1;
const TEXTURE_CUBE_MAP$1              = 0x8513;
const TEXTURE_3D$1                    = 0x806F;
const TEXTURE_2D_ARRAY$1              = 0x8C1A;

const typeMap = {};

/**
 * Returns the corresponding bind point for a given sampler type
 */
function getBindPointForSamplerType(gl, type) {
  return typeMap[type].bindPoint;
}

// This kind of sucks! If you could compose functions as in `var fn = gl[name];`
// this code could be a lot smaller but that is sadly really slow (T_T)

function floatSetter(gl, location) {
  return function(v) {
    gl.uniform1f(location, v);
  };
}

function floatArraySetter(gl, location) {
  return function(v) {
    gl.uniform1fv(location, v);
  };
}

function floatVec2Setter(gl, location) {
  return function(v) {
    gl.uniform2fv(location, v);
  };
}

function floatVec3Setter(gl, location) {
  return function(v) {
    gl.uniform3fv(location, v);
  };
}

function floatVec4Setter(gl, location) {
  return function(v) {
    gl.uniform4fv(location, v);
  };
}

function intSetter(gl, location) {
  return function(v) {
    gl.uniform1i(location, v);
  };
}

function intArraySetter(gl, location) {
  return function(v) {
    gl.uniform1iv(location, v);
  };
}

function intVec2Setter(gl, location) {
  return function(v) {
    gl.uniform2iv(location, v);
  };
}

function intVec3Setter(gl, location) {
  return function(v) {
    gl.uniform3iv(location, v);
  };
}

function intVec4Setter(gl, location) {
  return function(v) {
    gl.uniform4iv(location, v);
  };
}

function uintSetter(gl, location) {
  return function(v) {
    gl.uniform1ui(location, v);
  };
}

function uintArraySetter(gl, location) {
  return function(v) {
    gl.uniform1uiv(location, v);
  };
}

function uintVec2Setter(gl, location) {
  return function(v) {
    gl.uniform2uiv(location, v);
  };
}

function uintVec3Setter(gl, location) {
  return function(v) {
    gl.uniform3uiv(location, v);
  };
}

function uintVec4Setter(gl, location) {
  return function(v) {
    gl.uniform4uiv(location, v);
  };
}

function floatMat2Setter(gl, location) {
  return function(v) {
    gl.uniformMatrix2fv(location, false, v);
  };
}

function floatMat3Setter(gl, location) {
  return function(v) {
    gl.uniformMatrix3fv(location, false, v);
  };
}

function floatMat4Setter(gl, location) {
  return function(v) {
    gl.uniformMatrix4fv(location, false, v);
  };
}

function floatMat23Setter(gl, location) {
  return function(v) {
    gl.uniformMatrix2x3fv(location, false, v);
  };
}

function floatMat32Setter(gl, location) {
  return function(v) {
    gl.uniformMatrix3x2fv(location, false, v);
  };
}

function floatMat24Setter(gl, location) {
  return function(v) {
    gl.uniformMatrix2x4fv(location, false, v);
  };
}

function floatMat42Setter(gl, location) {
  return function(v) {
    gl.uniformMatrix4x2fv(location, false, v);
  };
}

function floatMat34Setter(gl, location) {
  return function(v) {
    gl.uniformMatrix3x4fv(location, false, v);
  };
}

function floatMat43Setter(gl, location) {
  return function(v) {
    gl.uniformMatrix4x3fv(location, false, v);
  };
}

function samplerSetter(gl, type, unit, location) {
  const bindPoint = getBindPointForSamplerType(gl, type);
  return isWebGL2(gl) ? function(textureOrPair) {
    let texture;
    let sampler;
    if (isTexture(gl, textureOrPair)) {
      texture = textureOrPair;
      sampler = null;
    } else {
      texture = textureOrPair.texture;
      sampler = textureOrPair.sampler;
    }
    gl.uniform1i(location, unit);
    gl.activeTexture(TEXTURE0 + unit);
    gl.bindTexture(bindPoint, texture);
    gl.bindSampler(unit, sampler);
  } : function(texture) {
    gl.uniform1i(location, unit);
    gl.activeTexture(TEXTURE0 + unit);
    gl.bindTexture(bindPoint, texture);
  };
}

function samplerArraySetter(gl, type, unit, location, size) {
  const bindPoint = getBindPointForSamplerType(gl, type);
  const units = new Int32Array(size);
  for (let ii = 0; ii < size; ++ii) {
    units[ii] = unit + ii;
  }

  return isWebGL2(gl) ? function(textures) {
    gl.uniform1iv(location, units);
    textures.forEach(function(textureOrPair, index) {
      gl.activeTexture(TEXTURE0 + units[index]);
      let texture;
      let sampler;
      if (isTexture(gl, textureOrPair)) {
        texture = textureOrPair;
        sampler = null;
      } else {
        texture = textureOrPair.texture;
        sampler = textureOrPair.sampler;
      }
      gl.bindSampler(unit, sampler);
      gl.bindTexture(bindPoint, texture);
    });
  } : function(textures) {
    gl.uniform1iv(location, units);
    textures.forEach(function(texture, index) {
      gl.activeTexture(TEXTURE0 + units[index]);
      gl.bindTexture(bindPoint, texture);
    });
  };
}

typeMap[FLOAT$3]                         = { Type: Float32Array, size:  4, setter: floatSetter,      arraySetter: floatArraySetter, };
typeMap[FLOAT_VEC2]                    = { Type: Float32Array, size:  8, setter: floatVec2Setter,  };
typeMap[FLOAT_VEC3]                    = { Type: Float32Array, size: 12, setter: floatVec3Setter,  };
typeMap[FLOAT_VEC4]                    = { Type: Float32Array, size: 16, setter: floatVec4Setter,  };
typeMap[INT$3]                           = { Type: Int32Array,   size:  4, setter: intSetter,        arraySetter: intArraySetter, };
typeMap[INT_VEC2]                      = { Type: Int32Array,   size:  8, setter: intVec2Setter,    };
typeMap[INT_VEC3]                      = { Type: Int32Array,   size: 12, setter: intVec3Setter,    };
typeMap[INT_VEC4]                      = { Type: Int32Array,   size: 16, setter: intVec4Setter,    };
typeMap[UNSIGNED_INT$3]                  = { Type: Uint32Array,  size:  4, setter: uintSetter,       arraySetter: uintArraySetter, };
typeMap[UNSIGNED_INT_VEC2]             = { Type: Uint32Array,  size:  8, setter: uintVec2Setter,   };
typeMap[UNSIGNED_INT_VEC3]             = { Type: Uint32Array,  size: 12, setter: uintVec3Setter,   };
typeMap[UNSIGNED_INT_VEC4]             = { Type: Uint32Array,  size: 16, setter: uintVec4Setter,   };
typeMap[BOOL]                          = { Type: Uint32Array,  size:  4, setter: intSetter,        arraySetter: intArraySetter, };
typeMap[BOOL_VEC2]                     = { Type: Uint32Array,  size:  8, setter: intVec2Setter,    };
typeMap[BOOL_VEC3]                     = { Type: Uint32Array,  size: 12, setter: intVec3Setter,    };
typeMap[BOOL_VEC4]                     = { Type: Uint32Array,  size: 16, setter: intVec4Setter,    };
typeMap[FLOAT_MAT2]                    = { Type: Float32Array, size: 16, setter: floatMat2Setter,  };
typeMap[FLOAT_MAT3]                    = { Type: Float32Array, size: 36, setter: floatMat3Setter,  };
typeMap[FLOAT_MAT4]                    = { Type: Float32Array, size: 64, setter: floatMat4Setter,  };
typeMap[FLOAT_MAT2x3]                  = { Type: Float32Array, size: 24, setter: floatMat23Setter, };
typeMap[FLOAT_MAT2x4]                  = { Type: Float32Array, size: 32, setter: floatMat24Setter, };
typeMap[FLOAT_MAT3x2]                  = { Type: Float32Array, size: 24, setter: floatMat32Setter, };
typeMap[FLOAT_MAT3x4]                  = { Type: Float32Array, size: 48, setter: floatMat34Setter, };
typeMap[FLOAT_MAT4x2]                  = { Type: Float32Array, size: 32, setter: floatMat42Setter, };
typeMap[FLOAT_MAT4x3]                  = { Type: Float32Array, size: 48, setter: floatMat43Setter, };
typeMap[SAMPLER_2D]                    = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1,       };
typeMap[SAMPLER_CUBE]                  = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP$1, };
typeMap[SAMPLER_3D]                    = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D$1,       };
typeMap[SAMPLER_2D_SHADOW]             = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1,       };
typeMap[SAMPLER_2D_ARRAY]              = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY$1, };
typeMap[SAMPLER_2D_ARRAY_SHADOW]       = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY$1, };
typeMap[SAMPLER_CUBE_SHADOW]           = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP$1, };
typeMap[INT_SAMPLER_2D]                = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1,       };
typeMap[INT_SAMPLER_3D]                = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D$1,       };
typeMap[INT_SAMPLER_CUBE]              = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP$1, };
typeMap[INT_SAMPLER_2D_ARRAY]          = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY$1, };
typeMap[UNSIGNED_INT_SAMPLER_2D]       = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1,       };
typeMap[UNSIGNED_INT_SAMPLER_3D]       = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D$1,       };
typeMap[UNSIGNED_INT_SAMPLER_CUBE]     = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP$1, };
typeMap[UNSIGNED_INT_SAMPLER_2D_ARRAY] = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY$1, };

function floatAttribSetter(gl, index) {
  return function(b) {
    if (b.value) {
      gl.disableVertexAttribArray(index);
      switch (b.value.length) {
        case 4:
          gl.vertexAttrib4fv(index, b.value);
          break;
        case 3:
          gl.vertexAttrib3fv(index, b.value);
          break;
        case 2:
          gl.vertexAttrib2fv(index, b.value);
          break;
        case 1:
          gl.vertexAttrib1fv(index, b.value);
          break;
        default:
          throw new Error('the length of a float constant value must be between 1 and 4!');
      }
    } else {
      gl.bindBuffer(ARRAY_BUFFER$1, b.buffer);
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(
          index, b.numComponents || b.size, b.type || FLOAT$3, b.normalize || false, b.stride || 0, b.offset || 0);
      if (b.divisor !== undefined) {
        gl.vertexAttribDivisor(index, b.divisor);
      }
    }
  };
}

function intAttribSetter(gl, index) {
  return function(b) {
    if (b.value) {
      gl.disableVertexAttribArray(index);
      if (b.value.length === 4) {
        gl.vertexAttrib4iv(index, b.value);
      } else {
        throw new Error('The length of an integer constant value must be 4!');
      }
    } else {
      gl.bindBuffer(ARRAY_BUFFER$1, b.buffer);
      gl.enableVertexAttribArray(index);
      gl.vertexAttribIPointer(
          index, b.numComponents || b.size, b.type || INT$3, b.stride || 0, b.offset || 0);
      if (b.divisor !== undefined) {
        gl.vertexAttribDivisor(index, b.divisor);
      }
    }
  };
}

function uintAttribSetter(gl, index) {
  return function(b) {
    if (b.value) {
      gl.disableVertexAttribArray(index);
      if (b.value.length === 4) {
        gl.vertexAttrib4uiv(index, b.value);
      } else {
        throw new Error('The length of an unsigned integer constant value must be 4!');
      }
    } else {
      gl.bindBuffer(ARRAY_BUFFER$1, b.buffer);
      gl.enableVertexAttribArray(index);
      gl.vertexAttribIPointer(
          index, b.numComponents || b.size, b.type || UNSIGNED_INT$3, b.stride || 0, b.offset || 0);
      if (b.divisor !== undefined) {
        gl.vertexAttribDivisor(index, b.divisor);
      }
    }
  };
}

function matAttribSetter(gl, index, typeInfo) {
  const defaultSize = typeInfo.size;
  const count = typeInfo.count;

  return function(b) {
    gl.bindBuffer(ARRAY_BUFFER$1, b.buffer);
    const numComponents = b.size || b.numComponents || defaultSize;
    const size = numComponents / count;
    const type = b.type || FLOAT$3;
    const typeInfo = typeMap[type];
    const stride = typeInfo.size * numComponents;
    const normalize = b.normalize || false;
    const offset = b.offset || 0;
    const rowOffset = stride / count;
    for (let i = 0; i < count; ++i) {
      gl.enableVertexAttribArray(index + i);
      gl.vertexAttribPointer(
          index + i, size, type, normalize, stride, offset + rowOffset * i);
      if (b.divisor !== undefined) {
        gl.vertexAttribDivisor(index + i, b.divisor);
      }
    }
  };
}



const attrTypeMap = {};
attrTypeMap[FLOAT$3]             = { size:  4, setter: floatAttribSetter, };
attrTypeMap[FLOAT_VEC2]        = { size:  8, setter: floatAttribSetter, };
attrTypeMap[FLOAT_VEC3]        = { size: 12, setter: floatAttribSetter, };
attrTypeMap[FLOAT_VEC4]        = { size: 16, setter: floatAttribSetter, };
attrTypeMap[INT$3]               = { size:  4, setter: intAttribSetter,   };
attrTypeMap[INT_VEC2]          = { size:  8, setter: intAttribSetter,   };
attrTypeMap[INT_VEC3]          = { size: 12, setter: intAttribSetter,   };
attrTypeMap[INT_VEC4]          = { size: 16, setter: intAttribSetter,   };
attrTypeMap[UNSIGNED_INT$3]      = { size:  4, setter: uintAttribSetter,  };
attrTypeMap[UNSIGNED_INT_VEC2] = { size:  8, setter: uintAttribSetter,  };
attrTypeMap[UNSIGNED_INT_VEC3] = { size: 12, setter: uintAttribSetter,  };
attrTypeMap[UNSIGNED_INT_VEC4] = { size: 16, setter: uintAttribSetter,  };
attrTypeMap[BOOL]              = { size:  4, setter: intAttribSetter,   };
attrTypeMap[BOOL_VEC2]         = { size:  8, setter: intAttribSetter,   };
attrTypeMap[BOOL_VEC3]         = { size: 12, setter: intAttribSetter,   };
attrTypeMap[BOOL_VEC4]         = { size: 16, setter: intAttribSetter,   };
attrTypeMap[FLOAT_MAT2]        = { size:  4, setter: matAttribSetter,   count: 2, };
attrTypeMap[FLOAT_MAT3]        = { size:  9, setter: matAttribSetter,   count: 3, };
attrTypeMap[FLOAT_MAT4]        = { size: 16, setter: matAttribSetter,   count: 4, };

/**
 * Returns true if attribute/uniform is a reserved/built in
 *
 * It makes no sense to me why GL returns these because it's
 * illegal to call `gl.getUniformLocation` and `gl.getAttribLocation`
 * with names that start with `gl_` (and `webgl_` in WebGL)
 *
 * I can only assume they are there because they might count
 * when computing the number of uniforms/attributes used when you want to
 * know if you are near the limit. That doesn't really make sense
 * to me but the fact that these get returned are in the spec.
 *
 * @param {WebGLActiveInfo} info As returned from `gl.getActiveUniform` or
 *    `gl.getActiveAttrib`.
 * @return {bool} true if it's reserved
 * @private
 */
function isBuiltIn(info) {
  const name = info.name;
  return name.startsWith("gl_") || name.startsWith("webgl_");
}

/**
 * Creates setter functions for all uniforms of a shader
 * program.
 *
 * @see {@link module:twgl.setUniforms}
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {WebGLProgram} program the program to create setters for.
 * @returns {Object.<string, function>} an object with a setter by name for each uniform
 * @memberOf module:twgl/programs
 */
function createUniformSetters(gl, program) {
  let textureUnit = 0;

  /**
   * Creates a setter for a uniform of the given program with it's
   * location embedded in the setter.
   * @param {WebGLProgram} program
   * @param {WebGLUniformInfo} uniformInfo
   * @returns {function} the created setter.
   */
  function createUniformSetter(program, uniformInfo, location) {
    const isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === "[0]");
    const type = uniformInfo.type;
    const typeInfo = typeMap[type];
    if (!typeInfo) {
      throw new Error(`unknown type: 0x${type.toString(16)}`); // we should never get here.
    }
    let setter;
    if (typeInfo.bindPoint) {
      // it's a sampler
      const unit = textureUnit;
      textureUnit += uniformInfo.size;
      if (isArray) {
        setter = typeInfo.arraySetter(gl, type, unit, location, uniformInfo.size);
      } else {
        setter = typeInfo.setter(gl, type, unit, location, uniformInfo.size);
      }
    } else {
      if (typeInfo.arraySetter && isArray) {
        setter = typeInfo.arraySetter(gl, location);
      } else {
        setter = typeInfo.setter(gl, location);
      }
    }
    setter.location = location;
    return setter;
  }

  const uniformSetters = { };
  const numUniforms = gl.getProgramParameter(program, ACTIVE_UNIFORMS);

  for (let ii = 0; ii < numUniforms; ++ii) {
    const uniformInfo = gl.getActiveUniform(program, ii);
    if (isBuiltIn(uniformInfo)) {
        continue;
    }
    let name = uniformInfo.name;
    // remove the array suffix.
    if (name.substr(-3) === "[0]") {
      name = name.substr(0, name.length - 3);
    }
    const location = gl.getUniformLocation(program, uniformInfo.name);
    // the uniform will have no location if it's in a uniform block
    if (location) {
      uniformSetters[name] = createUniformSetter(program, uniformInfo, location);
    }
  }
  return uniformSetters;
}

/**
 * @typedef {Object} TransformFeedbackInfo
 * @property {number} index index of transform feedback
 * @property {number} type GL type
 * @property {number} size 1 - 4
 * @memberOf module:twgl
 */

/**
 * Create TransformFeedbackInfo for passing to bindTransformFeedbackInfo.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {WebGLProgram} program an existing WebGLProgram.
 * @return {Object<string, module:twgl.TransformFeedbackInfo>}
 * @memberOf module:twgl
 */
function createTransformFeedbackInfo(gl, program) {
  const info = {};
  const numVaryings = gl.getProgramParameter(program, TRANSFORM_FEEDBACK_VARYINGS);
  for (let ii = 0; ii < numVaryings; ++ii) {
    const varying = gl.getTransformFeedbackVarying(program, ii);
    info[varying.name] = {
      index: ii,
      type: varying.type,
      size: varying.size,
    };
  }
  return info;
}

/**
 * @typedef {Object} UniformData
 * @property {number} type The WebGL type enum for this uniform
 * @property {number} size The number of elements for this uniform
 * @property {number} blockNdx The block index this uniform appears in
 * @property {number} offset The byte offset in the block for this uniform's value
 * @memberOf module:twgl
 */

/**
 * The specification for one UniformBlockObject
 *
 * @typedef {Object} BlockSpec
 * @property {number} index The index of the block.
 * @property {number} size The size in bytes needed for the block
 * @property {number[]} uniformIndices The indices of the uniforms used by the block. These indices
 *    correspond to entries in a UniformData array in the {@link module:twgl.UniformBlockSpec}.
 * @property {bool} usedByVertexShader Self explanatory
 * @property {bool} usedByFragmentShader Self explanatory
 * @property {bool} used Self explanatory
 * @memberOf module:twgl
 */

/**
 * A `UniformBlockSpec` represents the data needed to create and bind
 * UniformBlockObjects for a given program
 *
 * @typedef {Object} UniformBlockSpec
 * @property {Object.<string, module:twgl.BlockSpec> blockSpecs The BlockSpec for each block by block name
 * @property {UniformData[]} uniformData An array of data for each uniform by uniform index.
 * @memberOf module:twgl
 */

/**
 * Creates a UniformBlockSpec for the given program.
 *
 * A UniformBlockSpec represents the data needed to create and bind
 * UniformBlockObjects
 *
 * @param {WebGL2RenderingContext} gl A WebGL2 Rendering Context
 * @param {WebGLProgram} program A WebGLProgram for a successfully linked program
 * @return {module:twgl.UniformBlockSpec} The created UniformBlockSpec
 * @memberOf module:twgl/programs
 */
function createUniformBlockSpecFromProgram(gl, program) {
  const numUniforms = gl.getProgramParameter(program, ACTIVE_UNIFORMS);
  const uniformData = [];
  const uniformIndices = [];

  for (let ii = 0; ii < numUniforms; ++ii) {
    uniformIndices.push(ii);
    uniformData.push({});
    const uniformInfo = gl.getActiveUniform(program, ii);
    if (isBuiltIn(uniformInfo)) {
      break;
    }
    // REMOVE [0]?
    uniformData[ii].name = uniformInfo.name;
  }

  [
    [ "UNIFORM_TYPE", "type" ],
    [ "UNIFORM_SIZE", "size" ],  // num elements
    [ "UNIFORM_BLOCK_INDEX", "blockNdx" ],
    [ "UNIFORM_OFFSET", "offset", ],
  ].forEach(function(pair) {
    const pname = pair[0];
    const key = pair[1];
    gl.getActiveUniforms(program, uniformIndices, gl[pname]).forEach(function(value, ndx) {
      uniformData[ndx][key] = value;
    });
  });

  const blockSpecs = {};

  const numUniformBlocks = gl.getProgramParameter(program, ACTIVE_UNIFORM_BLOCKS);
  for (let ii = 0; ii < numUniformBlocks; ++ii) {
    const name = gl.getActiveUniformBlockName(program, ii);
    const blockSpec = {
      index: gl.getUniformBlockIndex(program, name),
      usedByVertexShader: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
      usedByFragmentShader: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
      size: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_DATA_SIZE),
      uniformIndices: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES),
    };
    blockSpec.used = blockSpec.usedByVertexShader || blockSpec.usedByFragmentShader;
    blockSpecs[name] = blockSpec;
  }

  return {
    blockSpecs: blockSpecs,
    uniformData: uniformData,
  };
}

/**
 * Set uniforms and binds related textures.
 *
 * example:
 *
 *     const programInfo = createProgramInfo(
 *         gl, ["some-vs", "some-fs"]);
 *
 *     const tex1 = gl.createTexture();
 *     const tex2 = gl.createTexture();
 *
 *     ... assume we setup the textures with data ...
 *
 *     const uniforms = {
 *       u_someSampler: tex1,
 *       u_someOtherSampler: tex2,
 *       u_someColor: [1,0,0,1],
 *       u_somePosition: [0,1,1],
 *       u_someMatrix: [
 *         1,0,0,0,
 *         0,1,0,0,
 *         0,0,1,0,
 *         0,0,0,0,
 *       ],
 *     };
 *
 *     gl.useProgram(program);
 *
 * This will automatically bind the textures AND set the
 * uniforms.
 *
 *     twgl.setUniforms(programInfo, uniforms);
 *
 * For the example above it is equivalent to
 *
 *     var texUnit = 0;
 *     gl.activeTexture(gl.TEXTURE0 + texUnit);
 *     gl.bindTexture(gl.TEXTURE_2D, tex1);
 *     gl.uniform1i(u_someSamplerLocation, texUnit++);
 *     gl.activeTexture(gl.TEXTURE0 + texUnit);
 *     gl.bindTexture(gl.TEXTURE_2D, tex2);
 *     gl.uniform1i(u_someSamplerLocation, texUnit++);
 *     gl.uniform4fv(u_someColorLocation, [1, 0, 0, 1]);
 *     gl.uniform3fv(u_somePositionLocation, [0, 1, 1]);
 *     gl.uniformMatrix4fv(u_someMatrix, false, [
 *         1,0,0,0,
 *         0,1,0,0,
 *         0,0,1,0,
 *         0,0,0,0,
 *       ]);
 *
 * Note it is perfectly reasonable to call `setUniforms` multiple times. For example
 *
 *     const uniforms = {
 *       u_someSampler: tex1,
 *       u_someOtherSampler: tex2,
 *     };
 *
 *     const moreUniforms {
 *       u_someColor: [1,0,0,1],
 *       u_somePosition: [0,1,1],
 *       u_someMatrix: [
 *         1,0,0,0,
 *         0,1,0,0,
 *         0,0,1,0,
 *         0,0,0,0,
 *       ],
 *     };
 *
 *     twgl.setUniforms(programInfo, uniforms);
 *     twgl.setUniforms(programInfo, moreUniforms);
 *
 * You can also add WebGLSamplers to uniform samplers as in
 *
 *     const uniforms = {
 *       u_someSampler: {
 *         texture: someWebGLTexture,
 *         sampler: someWebGLSampler,
 *       },
 *     };
 *
 * In which case both the sampler and texture will be bound to the
 * same unit.
 *
 * @param {(module:twgl.ProgramInfo|Object.<string, function>)} setters a `ProgramInfo` as returned from `createProgramInfo` or the setters returned from
 *        `createUniformSetters`.
 * @param {Object.<string, ?>} values an object with values for the
 *        uniforms.
 *   You can pass multiple objects by putting them in an array or by calling with more arguments.For example
 *
 *     const sharedUniforms = {
 *       u_fogNear: 10,
 *       u_projection: ...
 *       ...
 *     };
 *
 *     const localUniforms = {
 *       u_world: ...
 *       u_diffuseColor: ...
 *     };
 *
 *     twgl.setUniforms(programInfo, sharedUniforms, localUniforms);
 *
 *     // is the same as
 *
 *     twgl.setUniforms(programInfo, [sharedUniforms, localUniforms]);
 *
 *     // is the same as
 *
 *     twgl.setUniforms(programInfo, sharedUniforms);
 *     twgl.setUniforms(programInfo, localUniforms};
 *
 * @memberOf module:twgl/programs
 */
function setUniforms(setters, values) {  // eslint-disable-line
  const actualSetters = setters.uniformSetters || setters;
  const numArgs = arguments.length;
  for (let aNdx = 1; aNdx < numArgs; ++aNdx) {
    const values = arguments[aNdx];
    if (Array.isArray(values)) {
      const numValues = values.length;
      for (let ii = 0; ii < numValues; ++ii) {
        setUniforms(actualSetters, values[ii]);
      }
    } else {
      for (const name in values) {
        const setter = actualSetters[name];
        if (setter) {
          setter(values[name]);
        }
      }
    }
  }
}

/**
 * Creates setter functions for all attributes of a shader
 * program. You can pass this to {@link module:twgl.setBuffersAndAttributes} to set all your buffers and attributes.
 *
 * @see {@link module:twgl.setAttributes} for example
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {WebGLProgram} program the program to create setters for.
 * @return {Object.<string, function>} an object with a setter for each attribute by name.
 * @memberOf module:twgl/programs
 */
function createAttributeSetters(gl, program) {
  const attribSetters = {
  };

  const numAttribs = gl.getProgramParameter(program, ACTIVE_ATTRIBUTES);
  for (let ii = 0; ii < numAttribs; ++ii) {
    const attribInfo = gl.getActiveAttrib(program, ii);
    if (isBuiltIn(attribInfo)) {
        continue;
    }
    const index = gl.getAttribLocation(program, attribInfo.name);
    const typeInfo = attrTypeMap[attribInfo.type];
    const setter = typeInfo.setter(gl, index, typeInfo);
    setter.location = index;
    attribSetters[attribInfo.name] = setter;
  }

  return attribSetters;
}

/**
 * Sets attributes and binds buffers (deprecated... use {@link module:twgl.setBuffersAndAttributes})
 *
 * Example:
 *
 *     const program = createProgramFromScripts(
 *         gl, ["some-vs", "some-fs");
 *
 *     const attribSetters = createAttributeSetters(program);
 *
 *     const positionBuffer = gl.createBuffer();
 *     const texcoordBuffer = gl.createBuffer();
 *
 *     const attribs = {
 *       a_position: {buffer: positionBuffer, numComponents: 3},
 *       a_texcoord: {buffer: texcoordBuffer, numComponents: 2},
 *     };
 *
 *     gl.useProgram(program);
 *
 * This will automatically bind the buffers AND set the
 * attributes.
 *
 *     setAttributes(attribSetters, attribs);
 *
 * Properties of attribs. For each attrib you can add
 * properties:
 *
 * *   type: the type of data in the buffer. Default = gl.FLOAT
 * *   normalize: whether or not to normalize the data. Default = false
 * *   stride: the stride. Default = 0
 * *   offset: offset into the buffer. Default = 0
 * *   divisor: the divisor for instances. Default = undefined
 *
 * For example if you had 3 value float positions, 2 value
 * float texcoord and 4 value uint8 colors you'd setup your
 * attribs like this
 *
 *     const attribs = {
 *       a_position: {buffer: positionBuffer, numComponents: 3},
 *       a_texcoord: {buffer: texcoordBuffer, numComponents: 2},
 *       a_color: {
 *         buffer: colorBuffer,
 *         numComponents: 4,
 *         type: gl.UNSIGNED_BYTE,
 *         normalize: true,
 *       },
 *     };
 *
 * @param {Object.<string, function>} setters Attribute setters as returned from createAttributeSetters
 * @param {Object.<string, module:twgl.AttribInfo>} buffers AttribInfos mapped by attribute name.
 * @memberOf module:twgl/programs
 * @deprecated use {@link module:twgl.setBuffersAndAttributes}
 */
function setAttributes(setters, buffers) {
  for (const name in buffers) {
    const setter = setters[name];
    if (setter) {
      setter(buffers[name]);
    }
  }
}

/**
 * Sets attributes and buffers including the `ELEMENT_ARRAY_BUFFER` if appropriate
 *
 * Example:
 *
 *     const programInfo = createProgramInfo(
 *         gl, ["some-vs", "some-fs");
 *
 *     const arrays = {
 *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
 *       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
 *     };
 *
 *     const bufferInfo = createBufferInfoFromArrays(gl, arrays);
 *
 *     gl.useProgram(programInfo.program);
 *
 * This will automatically bind the buffers AND set the
 * attributes.
 *
 *     setBuffersAndAttributes(gl, programInfo, bufferInfo);
 *
 * For the example above it is equivalent to
 *
 *     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
 *     gl.enableVertexAttribArray(a_positionLocation);
 *     gl.vertexAttribPointer(a_positionLocation, 3, gl.FLOAT, false, 0, 0);
 *     gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
 *     gl.enableVertexAttribArray(a_texcoordLocation);
 *     gl.vertexAttribPointer(a_texcoordLocation, 4, gl.FLOAT, false, 0, 0);
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext.
 * @param {(module:twgl.ProgramInfo|Object.<string, function>)} setters A `ProgramInfo` as returned from {@link module:twgl.createProgramInfo} or Attribute setters as returned from {@link module:twgl.createAttributeSetters}
 * @param {(module:twgl.BufferInfo|module:twgl.VertexArrayInfo)} buffers a `BufferInfo` as returned from {@link module:twgl.createBufferInfoFromArrays}.
 *   or a `VertexArrayInfo` as returned from {@link module:twgl.createVertexArrayInfo}
 * @memberOf module:twgl/programs
 */
function setBuffersAndAttributes(gl, programInfo, buffers) {
  if (buffers.vertexArrayObject) {
    gl.bindVertexArray(buffers.vertexArrayObject);
  } else {
    setAttributes(programInfo.attribSetters || programInfo, buffers.attribs);
    if (buffers.indices) {
      gl.bindBuffer(ELEMENT_ARRAY_BUFFER$1, buffers.indices);
    }
  }
}

/**
 * @typedef {Object} ProgramInfo
 * @property {WebGLProgram} program A shader program
 * @property {Object<string, function>} uniformSetters object of setters as returned from createUniformSetters,
 * @property {Object<string, function>} attribSetters object of setters as returned from createAttribSetters,
 * @property {module:twgl.UniformBlockSpec} [uniformBlockSpace] a uniform block spec for making UniformBlockInfos with createUniformBlockInfo etc..
 * @property {Object<string, module:twgl.TransformFeedbackInfo>} [transformFeedbackInfo] info for transform feedbacks
 * @memberOf module:twgl
 */

/**
 * Creates a ProgramInfo from an existing program.
 *
 * A ProgramInfo contains
 *
 *     programInfo = {
 *        program: WebGLProgram,
 *        uniformSetters: object of setters as returned from createUniformSetters,
 *        attribSetters: object of setters as returned from createAttribSetters,
 *     }
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext
 *        to use.
 * @param {WebGLProgram} program an existing WebGLProgram.
 * @return {module:twgl.ProgramInfo} The created ProgramInfo.
 * @memberOf module:twgl/programs
 */
function createProgramInfoFromProgram(gl, program) {
  const uniformSetters = createUniformSetters(gl, program);
  const attribSetters = createAttributeSetters(gl, program);
  const programInfo = {
    program: program,
    uniformSetters: uniformSetters,
    attribSetters: attribSetters,
  };

  if (isWebGL2(gl)) {
    programInfo.uniformBlockSpec = createUniformBlockSpecFromProgram(gl, program);
    programInfo.transformFeedbackInfo = createTransformFeedbackInfo(gl, program);
  }

  return programInfo;
}

var quadShader = "#define GLSLIFY 1\nattribute vec4 position;attribute vec2 texcoord;varying vec2 v_texel;varying vec2 v_uv;varying float v_scale;uniform bool u_flipY;uniform vec2 u_textureSize;uniform vec2 u_screenSize;void main(){v_uv=texcoord;v_scale=floor(u_screenSize.y/u_textureSize.y+0.01);gl_Position=position;if(u_flipY){gl_Position.y*=-1.;}}"; // eslint-disable-line

var layerDrawShader = "precision highp float;\n#define GLSLIFY 1\nvarying vec2 v_uv;uniform sampler2D u_palette;uniform sampler2D u_bitmap;uniform float u_paletteOffset;const vec4 transparent=vec4(0,0,0,0);void main(){float index=texture2D(u_bitmap,v_uv).a*255.;if(index>0.){gl_FragColor=texture2D(u_palette,vec2((u_paletteOffset+index)/255.,.5));}else{gl_FragColor=transparent;}}"; // eslint-disable-line

var postProcessShader = "precision highp float;\n#define GLSLIFY 1\nvarying vec2 v_uv;uniform sampler2D u_tex;varying float v_scale;uniform vec2 u_textureSize;uniform vec2 u_screenSize;void main(){vec2 v_texel=v_uv*u_textureSize;vec2 texel_floored=floor(v_texel);vec2 s=fract(v_texel);float region_range=0.5-0.5/v_scale;vec2 center_dist=s-0.5;vec2 f=(center_dist-clamp(center_dist,-region_range,region_range))*v_scale+0.5;vec2 mod_texel=texel_floored+f;vec2 coord=mod_texel.xy/u_textureSize.xy;gl_FragColor=texture2D(u_tex,coord);}"; // eslint-disable-line

/** webgl canvas wrapper class */
class WebglCanvas {
    constructor(el, width = 640, height = 480) {
        this.refs = {
            programs: [],
            shaders: [],
            textures: [],
            buffers: [],
            framebuffers: []
        };
        const gl = el.getContext('webgl', {
            antialias: false,
            alpha: true
        });
        this.el = el;
        this.gl = gl;
        this.layerDrawProgram = this.createProgram(quadShader, layerDrawShader);
        this.postProcessProgram = this.createProgram(quadShader, postProcessShader);
        this.quadBuffer = this.createScreenQuad(-1, -1, 2, 2, 64, 64);
        setBuffersAndAttributes(gl, this.layerDrawProgram, this.quadBuffer);
        setBuffersAndAttributes(gl, this.postProcessProgram, this.quadBuffer);
        this.paletteTexture = this.createTexture(gl.RGBA, gl.NEAREST, gl.CLAMP_TO_EDGE, 256, 1);
        this.layerTexture = this.createTexture(gl.ALPHA, gl.NEAREST, gl.CLAMP_TO_EDGE);
        this.frameTexture = this.createTexture(gl.RGBA, gl.LINEAR, gl.CLAMP_TO_EDGE);
        this.frameBuffer = this.createFrameBuffer(this.frameTexture);
        // this.setPalette();
        this.setCanvasSize(width, height);
    }
    createProgram(vertexShaderSource, fragmentShaderSource) {
        const gl = this.gl;
        const vert = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const frag = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = gl.createProgram();
        // set up shaders
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        // link program
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            let log = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(log);
        }
        const programInfo = createProgramInfoFromProgram(gl, program);
        this.refs.programs.push(program);
        return programInfo;
    }
    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        // test if shader compilation was successful
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(log);
        }
        this.refs.shaders.push(shader);
        return shader;
    }
    createScreenQuad(x0, y0, width, height, xSubdivisions, ySubdivisions) {
        const numVerts = (xSubdivisions + 1) * (ySubdivisions + 1);
        const numVertsAcross = xSubdivisions + 1;
        const positions = new Float32Array(numVerts * 2);
        const texCoords = new Float32Array(numVerts * 2);
        let positionPtr = 0;
        let texCoordPtr = 0;
        for (let y = 0; y <= ySubdivisions; y++) {
            for (let x = 0; x <= xSubdivisions; x++) {
                const u = x / xSubdivisions;
                const v = y / ySubdivisions;
                positions[positionPtr++] = x0 + width * u;
                positions[positionPtr++] = y0 + height * v;
                texCoords[texCoordPtr++] = u;
                texCoords[texCoordPtr++] = v;
            }
        }
        const indices = new Uint16Array(xSubdivisions * ySubdivisions * 2 * 3);
        let indicesPtr = 0;
        for (let y = 0; y < ySubdivisions; y++) {
            for (let x = 0; x < xSubdivisions; x++) {
                // triangle 1
                indices[indicesPtr++] = (y + 0) * numVertsAcross + x;
                indices[indicesPtr++] = (y + 1) * numVertsAcross + x;
                indices[indicesPtr++] = (y + 0) * numVertsAcross + x + 1;
                // triangle 2
                indices[indicesPtr++] = (y + 0) * numVertsAcross + x + 1;
                indices[indicesPtr++] = (y + 1) * numVertsAcross + x;
                indices[indicesPtr++] = (y + 1) * numVertsAcross + x + 1;
            }
        }
        return createBufferInfoFromArrays(this.gl, {
            position: {
                numComponents: 2,
                data: positions
            },
            texcoord: {
                numComponents: 2,
                data: texCoords
            },
            indices: indices
        });
    }
    createTexture(type, minMag, wrap, width = 1, height = 1) {
        const gl = this.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minMag);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, minMag);
        gl.texImage2D(gl.TEXTURE_2D, 0, type, width, height, 0, type, gl.UNSIGNED_BYTE, null);
        this.refs.textures.push(tex);
        return tex;
    }
    createFrameBuffer(colorTexture) {
        const gl = this.gl;
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        // enable alpha blending
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        // bind a texture to the framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
        this.refs.framebuffers.push(fb);
        return fb;
    }
    setCanvasSize(width, height) {
        const dpi = window.devicePixelRatio || 1;
        const internalWidth = width * dpi;
        const internalHeight = height * dpi;
        this.el.width = internalWidth;
        this.el.height = internalHeight;
        this.width = internalWidth;
        this.height = internalHeight;
        this.el.style.width = `${width}px`;
        this.el.style.height = `${height}px`;
    }
    setTextureSize(width, height) {
        const gl = this.gl;
        this.textureWidth = width;
        this.textureHeight = height;
        // resize frame texture
        gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureWidth, this.textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    clearFrameBuffer(paperColor) {
        const gl = this.gl;
        // bind to the frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.viewport(0, 0, this.textureWidth, this.textureHeight);
        // clear it using the paper color
        const [r, g, b, a] = paperColor;
        gl.clearColor(r / 255, g / 255, b / 255, a / 255);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    setPalette(colors) {
        const gl = this.gl;
        const data = new Uint8Array(256 * 4);
        let dataPtr = 0;
        for (let i = 0; i < colors.length; i++) {
            const [r, g, b, a] = colors[i];
            data[dataPtr++] = r;
            data[dataPtr++] = g;
            data[dataPtr++] = b;
            data[dataPtr++] = a;
        }
        // update layer texture pixels
        gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }
    drawPixels(pixels, paletteOffset) {
        const { gl, layerDrawProgram, layerTexture, textureWidth, textureHeight, } = this;
        // we wanna draw to the frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.viewport(0, 0, textureWidth, textureHeight);
        // using the layer draw program
        gl.useProgram(layerDrawProgram.program);
        // update layer texture pixels
        gl.bindTexture(gl.TEXTURE_2D, layerTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, textureWidth, textureHeight, 0, gl.ALPHA, gl.UNSIGNED_BYTE, pixels);
        // prep uniforms
        setUniforms(layerDrawProgram, {
            u_palette: this.paletteTexture,
            u_paletteOffset: paletteOffset,
            u_bitmap: layerTexture,
            u_textureSize: [textureWidth, textureHeight],
            u_screenSize: [gl.drawingBufferWidth, gl.drawingBufferHeight],
        });
        // draw screen quad
        gl.drawElements(gl.TRIANGLES, this.quadBuffer.numElements, this.quadBuffer.elementType, 0);
    }
    composite() {
        const gl = this.gl;
        // setting gl.FRAMEBUFFER will draw directly to the screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        // using postprocess program
        gl.useProgram(this.postProcessProgram.program);
        // clear whatever's already been drawn
        gl.clear(gl.COLOR_BUFFER_BIT);
        // prep uniforms
        setUniforms(this.postProcessProgram, {
            u_flipY: true,
            u_tex: this.frameTexture,
            u_textureSize: [this.textureWidth, this.textureHeight],
            u_screenSize: [gl.drawingBufferWidth, gl.drawingBufferHeight],
        });
        // draw screen quad
        gl.drawElements(gl.TRIANGLES, this.quadBuffer.numElements, this.quadBuffer.elementType, 0);
    }
    resize(width = 640, height = 480) {
        this.setCanvasSize(width, height);
    }
    destroy() {
        // free resources
        const refs = this.refs;
        const gl = this.gl;
        refs.shaders.forEach((shader) => {
            gl.deleteShader(shader);
        });
        refs.shaders = [];
        refs.framebuffers.forEach((fb) => {
            gl.deleteFramebuffer(fb);
        });
        refs.framebuffers = [];
        refs.textures.forEach((texture) => {
            gl.deleteTexture(texture);
        });
        refs.textures = [];
        refs.buffers.forEach((buffer) => {
            gl.deleteBuffer(buffer);
        });
        refs.buffers = [];
        refs.programs.forEach((program) => {
            gl.deleteProgram(program);
        });
        refs.programs = [];
        // shrink the canvas to reduce memory usage until it is garbage collected
        gl.canvas.width = 1;
        gl.canvas.height = 1;
    }
}

const _AudioContext = (window.AudioContext || window.webkitAudioContext);
class WebAudioPlayer {
    constructor() {
        this.useEq = false;
        // Thanks to Sudomemo for the default settings
        this.eqSettings = [
            [31.25, 4.1],
            [62.5, 1.2],
            [125, 0],
            [250, -4.1],
            [500, -2.3],
            [1000, 0.5],
            [2000, 6.5],
            [8000, 5.1],
            [16000, 5.1]
        ];
        this._volume = 1;
        this.ctx = new _AudioContext();
    }
    set volume(value) {
        this.setVolume(value);
    }
    get volume() {
        return this._volume;
    }
    setSamples(sampleData, sampleRate) {
        const numSamples = sampleData.length;
        const audioBuffer = this.ctx.createBuffer(1, numSamples, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        if (sampleData instanceof Float32Array)
            channelData.set(sampleData, 0);
        else if (sampleData instanceof Int16Array) {
            for (let i = 0; i < numSamples; i++) {
                channelData[i] = sampleData[i] / 32767;
            }
        }
        this.buffer = audioBuffer;
        this.sampleRate = sampleRate;
    }
    connectEqNodesTo(inNode) {
        const { ctx, eqSettings } = this;
        let lastNode = inNode;
        eqSettings.forEach(([frequency, gain], index) => {
            let node = ctx.createBiquadFilter();
            node.frequency.value = frequency;
            node.gain.value = gain;
            if (index === 0)
                node.type = 'lowshelf';
            else if (index === eqSettings.length - 1)
                node.type = 'highshelf';
            else
                node.type = 'peaking';
            lastNode.connect(node);
            lastNode = node;
        });
        return lastNode;
    }
    initNodes() {
        const { ctx } = this;
        const source = ctx.createBufferSource();
        source.buffer = this.buffer;
        const gainNode = ctx.createGain();
        if (this.useEq) {
            const eq = this.connectEqNodesTo(source);
            eq.connect(gainNode);
        }
        else
            source.connect(gainNode);
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        this.source = source;
        this.gainNode = gainNode;
        this.setVolume(this._volume);
    }
    setVolume(value) {
        this._volume = value;
        if (this.gainNode) {
            // human perception of loudness is logarithmic, rather than linear
            // https://www.dr-lex.be/info-stuff/volumecontrols.html
            this.gainNode.gain.value = Math.pow(value, 2);
        }
    }
    stop() {
        this.source.stop(0);
    }
    playFrom(currentTime) {
        this.initNodes();
        this.source.start(0, currentTime);
    }
}

const saveData = (function () {
    var a = document.createElement("a");
    // document.body.appendChild(a);
    // a.style.display = "none";
    return function (blob, filename) {
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());
/** flipnote player API, based on HTMLMediaElement (https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) */
class Player {
    constructor(el, width, height) {
        this.loop = false;
        this.paused = true;
        this.duration = 0;
        this.isOpen = false;
        this.events = {};
        this._lastTick = -1;
        this._frame = -1;
        this._time = -1;
        this.hasPlaybackStarted = false;
        this.wasPlaying = false;
        this.isSeeking = false;
        // if `el` is a string, use it to select an Element, else assume it's an element
        el = ('string' == typeof el) ? document.querySelector(el) : el;
        this.canvas = new WebglCanvas(el, width, height);
        this.audio = new WebAudioPlayer();
        this.el = this.canvas.el;
        this.customPalette = null;
        this.state = { ...Player.defaultState };
    }
    get currentFrame() {
        return this._frame;
    }
    set currentFrame(frameIndex) {
        this.setFrame(frameIndex);
    }
    get currentTime() {
        return this.isOpen ? this._time : null;
    }
    set currentTime(value) {
        if ((this.isOpen) && (value <= this.duration) && (value >= 0)) {
            this.setFrame(Math.round(value / (1 / this.framerate)));
            this._time = value;
            this.emit('progress', this.progress);
        }
    }
    get progress() {
        return this.isOpen ? (this._time / this.duration) * 100 : 0;
    }
    set progress(value) {
        this.currentTime = this.duration * (value / 100);
    }
    get volume() {
        return this.audio.volume;
    }
    set volume(value) {
        this.audio.volume = value;
    }
    get muted() {
        // return this.audioTracks[3].audio.muted;
        return false;
    }
    set muted(value) {
        // for (let i = 0; i < this.audioTracks.length; i++) {
        //   this.audioTracks[i].audio.muted = value;
        // }
    }
    get framerate() {
        return this.note.framerate;
    }
    get frameCount() {
        return this.note.frameCount;
    }
    get frameSpeed() {
        return this.note.frameSpeed;
    }
    setState(newState) {
        newState = { ...this.state, ...newState };
        const oldState = this.state;
        this.emit('state:change');
    }
    async open(source) {
        if (this.isOpen)
            this.close();
        return parseSource(source)
            .then((note) => this.load(note))
            .catch((err) => {
            this.emit('error', err);
            console.error('Error loading Flipnote:', err);
            throw 'Error loading Flipnote';
        });
    }
    close() {
        this.pause();
        this.note = null;
        this.isOpen = false;
        this.paused = true;
        this.loop = null;
        this.meta = null;
        this._frame = null;
        this._time = null;
        this.duration = null;
        this.loop = null;
        this.hasPlaybackStarted = null;
        // this.canvas.clearFrameBuffer();
    }
    load(note) {
        this.note = note;
        this.meta = note.meta;
        this.type = note.type;
        this.loop = note.meta.loop;
        this.duration = (this.note.frameCount) * (1 / this.note.framerate);
        this.paused = true;
        this.isOpen = true;
        this.hasPlaybackStarted = false;
        this.layerVisibility = {
            1: true,
            2: true,
            3: true
        };
        const sampleRate = this.note.sampleRate;
        const pcm = note.getAudioMasterPcm();
        this.audio.setSamples(pcm, sampleRate);
        this.canvas.setTextureSize(note.width, note.height);
        this.setFrame(this.note.thumbFrameIndex);
        this._time = 0;
        this.emit('load');
    }
    playAudio() {
        this.audio.playFrom(this.currentTime);
    }
    stopAudio() {
        this.audio.stop();
    }
    toggleEq() {
        this.stopAudio();
        this.audio.useEq = !this.audio.useEq;
        this.playAudio();
    }
    playbackLoop(timestamp) {
        if (this.paused) { // break loop if paused is set to true
            this.stopAudio();
            return null;
        }
        const time = timestamp / 1000;
        const progress = time - this._lastTick;
        if (progress > this.duration) {
            if (this.loop) {
                this.currentTime = 0;
                this.playAudio();
                this._lastTick = time;
                this.emit('playback:loop');
            }
            else {
                this.pause();
                this.emit('playback:end');
            }
        }
        else {
            this.currentTime = progress;
        }
        requestAnimationFrame(this.playbackLoop.bind(this));
    }
    play() {
        window.__activeFlipnotePlayer = this;
        if ((!this.isOpen) || (!this.paused))
            return null;
        if ((!this.hasPlaybackStarted) || ((!this.loop) && (this.currentFrame == this.frameCount - 1)))
            this._time = 0;
        this.paused = false;
        this.hasPlaybackStarted = true;
        this._lastTick = (performance.now() / 1000) - this.currentTime;
        this.playAudio();
        requestAnimationFrame(this.playbackLoop.bind(this));
        this.emit('playback:start');
    }
    pause() {
        if ((!this.isOpen) || (this.paused))
            return null;
        this.paused = true;
        this.stopAudio();
        this.emit('playback:stop');
    }
    togglePlay() {
        if (this.paused) {
            this.play();
        }
        else {
            this.pause();
        }
    }
    setFrame(frameIndex) {
        if ((this.isOpen) && (frameIndex !== this.currentFrame)) {
            // clamp frame index
            frameIndex = Math.max(0, Math.min(Math.floor(frameIndex), this.frameCount - 1));
            this.drawFrame(frameIndex);
            this._frame = frameIndex;
            if (this.paused) {
                this._time = frameIndex * (1 / this.framerate);
                this.emit('progress', this.progress);
            }
            this.emit('frame:update', this.currentFrame);
        }
    }
    nextFrame() {
        if ((this.loop) && (this.currentFrame >= this.frameCount - 1)) {
            this.currentFrame = 0;
        }
        else {
            this.currentFrame += 1;
        }
    }
    prevFrame() {
        if ((this.loop) && (this.currentFrame <= 0)) {
            this.currentFrame = this.frameCount - 1;
        }
        else {
            this.currentFrame -= 1;
        }
    }
    lastFrame() {
        this.currentFrame = this.frameCount - 1;
    }
    firstFrame() {
        this.currentFrame = 0;
    }
    thumbnailFrame() {
        this.currentFrame = this.note.thumbFrameIndex;
    }
    startSeek() {
        if (!this.isSeeking) {
            this.wasPlaying = !this.paused;
            this.pause();
            this.isSeeking = true;
        }
    }
    seek(progress) {
        if (this.isSeeking) {
            this.progress = progress;
        }
    }
    endSeek() {
        if ((this.isSeeking) && (this.wasPlaying === true)) {
            this.play();
        }
        this.wasPlaying = false;
        this.isSeeking = false;
    }
    getMasterWav() {
        return WavEncoder.fromFlipnote(this.note);
    }
    saveMasterWav() {
        const wav = this.getMasterWav();
        saveData(wav.getBlob(), `${this.meta.current.filename}.wav`);
    }
    getFrameGif(frameIndex, meta = {}) {
        return GifEncoder.fromFlipnoteFrame(this.note, frameIndex, meta);
    }
    saveFrameGif(frameIndex, meta = {}) {
        const gif = this.getFrameGif(frameIndex, meta);
        saveData(gif.getBlob(), `${this.meta.current.filename}_${frameIndex.toString().padStart(3, '0')}.gif`);
    }
    getAnimatedGif(meta = {}) {
        return GifEncoder.fromFlipnote(this.note, meta);
    }
    saveAnimatedGif(meta = {}) {
        const gif = this.getAnimatedGif(meta);
        saveData(gif.getBlob(), `${this.meta.current.filename}.gif`);
    }
    drawFrame(frameIndex) {
        const colors = this.note.getFramePalette(frameIndex);
        const layerBuffers = this.note.decodeFrame(frameIndex);
        // this.canvas.setPaperColor(colors[0]);
        this.canvas.setPalette(colors);
        this.canvas.clearFrameBuffer(colors[0]);
        if (this.note.type === 'PPM') {
            if (this.layerVisibility[2])
                this.canvas.drawPixels(layerBuffers[1], 1);
            if (this.layerVisibility[1])
                this.canvas.drawPixels(layerBuffers[0], 0);
        }
        else if (this.note.type === 'KWZ') {
            // loop through each layer
            const order = this.note.getLayerOrder(frameIndex);
            const layerIndexA = order[0];
            const layerIndexB = order[1];
            const layerIndexC = order[2];
            if (this.layerVisibility[layerIndexA + 1])
                this.canvas.drawPixels(layerBuffers[layerIndexA], layerIndexA * 2);
            if (this.layerVisibility[layerIndexB + 1])
                this.canvas.drawPixels(layerBuffers[layerIndexB], layerIndexB * 2);
            if (this.layerVisibility[layerIndexC + 1])
                this.canvas.drawPixels(layerBuffers[layerIndexC], layerIndexC * 2);
        }
        this.canvas.composite();
    }
    forceUpdate() {
        if (this.isOpen) {
            this.drawFrame(this.currentFrame);
        }
    }
    resize(width, height) {
        this.canvas.resize(width, height);
        this.forceUpdate();
    }
    setLayerVisibility(layerIndex, value) {
        this.layerVisibility[layerIndex] = value;
        this.forceUpdate();
    }
    toggleLayerVisibility(layerIndex) {
        this.setLayerVisibility(layerIndex, !this.layerVisibility[layerIndex]);
    }
    // public setPalette(palette: any): void {
    //   this.customPalette = palette;
    //   this.note.palette = palette;
    //   this.forceUpdate();
    // }
    on(eventType, callback) {
        const events = this.events;
        (events[eventType] || (events[eventType] = [])).push(callback);
    }
    off(eventType, callback) {
        const callbackList = this.events[eventType];
        if (callbackList)
            callbackList.splice(callbackList.indexOf(callback), 1);
    }
    emit(eventType, ...args) {
        var callbackList = this.events[eventType] || [];
        for (var i = 0; i < callbackList.length; i++) {
            callbackList[i].apply(null, args);
        }
    }
    clearEvents() {
        this.events = {};
    }
    destroy() {
        this.close();
        this.canvas.destroy();
    }
}
Player.defaultState = {
    noteType: null,
    isNoteOpen: false,
    paused: false,
    hasPlaybackStarted: false,
    frame: -1,
    time: -1,
    loop: false,
    volume: 1,
    muted: false,
    layerVisibility: {
        1: true,
        2: true,
        3: true
    },
    isSeeking: false,
    wasPlaying: false,
};

// Main entrypoint for web
var api;
(function (api) {
    api.version = "5.0.0"; // replaced by @rollup/plugin-replace; see rollup.config.js
    api.player = Player;
    api.parseSource = parseSource;
    api.kwzParser = KwzParser;
    api.ppmParser = PpmParser;
    api.gifEncoder = GifEncoder;
    api.wavEncoder = WavEncoder;
})(api || (api = {}));
var api$1 = api;
const version = "5.0.0";
const player = Player;
const parseSource$1 = parseSource;
const kwzParser = KwzParser;
const ppmParser = PpmParser;
const gifEncoder = GifEncoder;
const wavEncoder = WavEncoder;

export default api$1;
export { gifEncoder, kwzParser, parseSource$1 as parseSource, player, ppmParser, version, wavEncoder };
