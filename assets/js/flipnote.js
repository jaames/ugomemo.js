/*!!
flipnote.js v5.3.0 (web build)
https://flipnote.js.org
A JavaScript library for parsing, converting, and in-browser playback of the proprietary animation formats used by Nintendo's Flipnote Studio and Flipnote Studio 3D apps.
2018 - 2021 James Daniel
Flipnote Studio is (c) Nintendo Co., Ltd. This project isn't affiliated with or endorsed by them in any way.
Keep on Flipnoting!
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.flipnote = {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    /** @internal */
    var ByteArray = /** @class */ (function () {
        function ByteArray() {
            this.pageSize = ByteArray.pageSize;
            this.currPageIndex = -1;
            this.pages = [];
            this.pointer = 0;
            this.newPage();
        }
        ByteArray.prototype.newPage = function () {
            this.pages[++this.currPageIndex] = new Uint8Array(this.pageSize);
            this.currPage = this.pages[this.currPageIndex];
            this.pointer = 0;
        };
        ByteArray.prototype.getData = function () {
            var data = new Uint8Array(this.currPageIndex * this.pageSize + this.pointer);
            for (var index = 0; index < this.pages.length; index++) {
                var page = this.pages[index];
                if (index === this.currPageIndex)
                    data.set(page.slice(0, this.pointer), index * this.pageSize);
                else
                    data.set(page, index * this.pageSize);
            }
            return data;
        };
        ByteArray.prototype.getBuffer = function () {
            var data = this.getData();
            return data.buffer;
        };
        ByteArray.prototype.writeByte = function (val) {
            if (this.pointer >= this.pageSize)
                this.newPage();
            this.currPage[this.pointer++] = val;
        };
        ByteArray.prototype.writeBytes = function (bytes, offset, length) {
            for (var l = length || bytes.length, i = offset || 0; i < l; i++)
                this.writeByte(bytes[i]);
        };
        ByteArray.pageSize = 2048;
        return ByteArray;
    }());

    /**
     * Wrapper around the DataView API to keep track of the offset into the data
     * also provides some utils for reading ascii strings etc
     * @internal
     */
    var DataStream = /** @class */ (function () {
        function DataStream(arrayBuffer) {
            this.buffer = arrayBuffer;
            this.data = new DataView(arrayBuffer);
            this.pointer = 0;
        }
        Object.defineProperty(DataStream.prototype, "bytes", {
            get: function () {
                return new Uint8Array(this.buffer);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DataStream.prototype, "byteLength", {
            get: function () {
                return this.data.byteLength;
            },
            enumerable: false,
            configurable: true
        });
        DataStream.prototype.seek = function (offset, whence) {
            switch (whence) {
                case 2 /* End */:
                    this.pointer = this.data.byteLength + offset;
                    break;
                case 1 /* Current */:
                    this.pointer += offset;
                    break;
                case 0 /* Begin */:
                default:
                    this.pointer = offset;
                    break;
            }
        };
        DataStream.prototype.readUint8 = function () {
            var val = this.data.getUint8(this.pointer);
            this.pointer += 1;
            return val;
        };
        DataStream.prototype.writeUint8 = function (value) {
            this.data.setUint8(this.pointer, value);
            this.pointer += 1;
        };
        DataStream.prototype.readInt8 = function () {
            var val = this.data.getInt8(this.pointer);
            this.pointer += 1;
            return val;
        };
        DataStream.prototype.writeInt8 = function (value) {
            this.data.setInt8(this.pointer, value);
            this.pointer += 1;
        };
        DataStream.prototype.readUint16 = function (littleEndian) {
            if (littleEndian === void 0) { littleEndian = true; }
            var val = this.data.getUint16(this.pointer, littleEndian);
            this.pointer += 2;
            return val;
        };
        DataStream.prototype.writeUint16 = function (value, littleEndian) {
            if (littleEndian === void 0) { littleEndian = true; }
            this.data.setUint16(this.pointer, value, littleEndian);
            this.pointer += 2;
        };
        DataStream.prototype.readInt16 = function (littleEndian) {
            if (littleEndian === void 0) { littleEndian = true; }
            var val = this.data.getInt16(this.pointer, littleEndian);
            this.pointer += 2;
            return val;
        };
        DataStream.prototype.writeInt16 = function (value, littleEndian) {
            if (littleEndian === void 0) { littleEndian = true; }
            this.data.setInt16(this.pointer, value, littleEndian);
            this.pointer += 2;
        };
        DataStream.prototype.readUint32 = function (littleEndian) {
            if (littleEndian === void 0) { littleEndian = true; }
            var val = this.data.getUint32(this.pointer, littleEndian);
            this.pointer += 4;
            return val;
        };
        DataStream.prototype.writeUint32 = function (value, littleEndian) {
            if (littleEndian === void 0) { littleEndian = true; }
            this.data.setUint32(this.pointer, value, littleEndian);
            this.pointer += 4;
        };
        DataStream.prototype.readInt32 = function (littleEndian) {
            if (littleEndian === void 0) { littleEndian = true; }
            var val = this.data.getInt32(this.pointer, littleEndian);
            this.pointer += 4;
            return val;
        };
        DataStream.prototype.writeInt32 = function (value, littleEndian) {
            if (littleEndian === void 0) { littleEndian = true; }
            this.data.setInt32(this.pointer, value, littleEndian);
            this.pointer += 4;
        };
        DataStream.prototype.readBytes = function (count) {
            var bytes = new Uint8Array(this.data.buffer, this.pointer, count);
            this.pointer += bytes.byteLength;
            return bytes;
        };
        DataStream.prototype.writeBytes = function (bytes) {
            var _this = this;
            bytes.forEach(function (byte) { return _this.writeUint8(byte); });
        };
        DataStream.prototype.readHex = function (count, reverse) {
            if (reverse === void 0) { reverse = false; }
            var bytes = this.readBytes(count);
            var hex = [];
            for (var i = 0; i < bytes.length; i++) {
                hex.push(bytes[i].toString(16).padStart(2, '0'));
            }
            if (reverse)
                hex.reverse();
            return hex.join('').toUpperCase();
        };
        DataStream.prototype.readChars = function (count) {
            var chars = this.readBytes(count);
            var str = '';
            for (var i = 0; i < chars.length; i++) {
                var char = chars[i];
                if (char === 0)
                    break;
                str += String.fromCharCode(char);
            }
            return str;
        };
        DataStream.prototype.writeChars = function (string) {
            for (var i = 0; i < string.length; i++) {
                var char = string.charCodeAt(i);
                this.writeUint8(char);
            }
        };
        DataStream.prototype.readWideChars = function (count) {
            var chars = new Uint16Array(this.data.buffer, this.pointer, count);
            var str = '';
            for (var i = 0; i < chars.length; i++) {
                var char = chars[i];
                if (char == 0)
                    break;
                str += String.fromCharCode(char);
            }
            this.pointer += chars.byteLength;
            return str;
        };
        return DataStream;
    }());

    /** @internal */
    var ADPCM_INDEX_TABLE_2BIT = new Int8Array([
        -1, 2, -1, 2
    ]);
    /** @internal */
    var ADPCM_INDEX_TABLE_4BIT = new Int8Array([
        -1, -1, -1, -1, 2, 4, 6, 8,
        -1, -1, -1, -1, 2, 4, 6, 8
    ]);
    /** @internal */
    var ADPCM_STEP_TABLE = new Int16Array([
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
    /** @internal */
    function clamp(n, l, h) {
        if (n < l)
            return l;
        if (n > h)
            return h;
        return n;
    }
    /** @internal */
    function pcmGetSample(src, srcSize, srcPtr) {
        if (srcPtr < 0 || srcPtr >= srcSize)
            return 0;
        return src[srcPtr];
    }
    /**
     * Zero-order hold (nearest neighbour) audio interpolation
     * Credit to SimonTime for the original C version
     * @internal
     */
    function pcmResampleNearestNeighbour(src, srcFreq, dstFreq) {
        var srcLength = src.length;
        var srcDuration = srcLength / srcFreq;
        var dstLength = srcDuration * dstFreq;
        var dst = new Int16Array(dstLength);
        var adjFreq = srcFreq / dstFreq;
        for (var dstPtr = 0; dstPtr < dstLength; dstPtr++) {
            dst[dstPtr] = pcmGetSample(src, srcLength, Math.floor(dstPtr * adjFreq));
        }
        return dst;
    }
    /**
     * Simple linear audio interpolation
     * @internal
     */
    function pcmResampleLinear(src, srcFreq, dstFreq) {
        var srcLength = src.length;
        var srcDuration = srcLength / srcFreq;
        var dstLength = srcDuration * dstFreq;
        var dst = new Int16Array(dstLength);
        var adjFreq = srcFreq / dstFreq;
        for (var dstPtr = 0, adj = 0, srcPtr = 0, weight = 0; dstPtr < dstLength; dstPtr++) {
            adj = dstPtr * adjFreq;
            srcPtr = Math.floor(adj);
            weight = adj % 1;
            dst[dstPtr] = (1 - weight) * pcmGetSample(src, srcLength, srcPtr) + weight * pcmGetSample(src, srcLength, srcPtr + 1);
        }
        return dst;
    }
    /**
     * Get a ratio of how many audio samples hit the pcm_s16_le clipping bounds
     * This can be used to detect corrupted audio
     * @internal
     */
    function pcmGetClippingRatio(src) {
        var numSamples = src.length;
        var numClippedSamples = 0;
        for (var i = 0; i < numSamples; i++) {
            var sample = src[i];
            if (sample <= -32768 || sample >= 32767)
                numClippedSamples += 1;
        }
        return numClippedSamples / numSamples;
    }

    /**
     * Assert condition is true
     * @internal
     */
    function assert(condition, errMsg) {
        if (errMsg === void 0) { errMsg = 'Assert failed'; }
        if (!condition) {
            console.trace(errMsg);
            throw new Error(errMsg);
        }
    }
    /**
     * Assert that a numberical value is between upper and lower bounds
     * @internal
     */
    function assertRange(value, min, max, name) {
        if (name === void 0) { name = ''; }
        assert(value >= min && value <= max, "Value " + name + " should be between " + min + " and " + max);
    }

    /**
     * Utils to find out information about the current code execution environment
     */
    /**
     * Is the code running in a browser environment?
     * @internal
     */
    var isBrowser = typeof window !== 'undefined'
        && typeof window.document !== 'undefined';
    /**
     * Assert that the current environment should support browser APIs
     * @internal
     */
    function assertBrowserEnv() {
        return assert(isBrowser, 'This feature is only available in browser environments');
    }
    /**
     * Is the code running in a Node environment?
     * @internal
     */
    var isNode = typeof process !== 'undefined'
        && process.versions != null
        && process.versions.node != null;
    /**
     * Assert that the current environment should support NodeJS APIs
     * @internal
     */
    function assertNodeEnv() {
        return assert(isNode, 'This feature is only available in NodeJS environments');
    }

    /**
     * Number of seconds between the UNIX timestamp epoch (jan 1 1970) and the Nintendo timestamp epoch (jan 1 2000)
     * @internal
     */
    var UNIX_EPOCH_2000 = 946684800;
    /**
     * Convert a Nintendo DS or 3DS timestamp int to a JS Date object
     * @internal
     */
    function dateFromNintendoTimestamp(timestamp) {
        return new Date((timestamp + UNIX_EPOCH_2000) * 1000);
    }
    /**
     * Get the duration (in seconds) of a number of framres running at a specified framerate
     * @internal
     */
    function timeGetNoteDuration(frameCount, framerate) {
        // multiply and devide by 100 to get around floating precision issues
        return ((frameCount * 100) * (1 / framerate)) / 100;
    }

    /**
     * Flipnote region
     */
    (function (FlipnoteRegion) {
        /** Europe and Oceania */
        FlipnoteRegion["EUR"] = "EUR";
        /** Americas */
        FlipnoteRegion["USA"] = "USA";
        /** Japan */
        FlipnoteRegion["JPN"] = "JPN";
        /** Unidentified (possibly never used) */
        FlipnoteRegion["UNKNOWN"] = "UNKNOWN";
    })(exports.FlipnoteRegion || (exports.FlipnoteRegion = {}));
    /**
     * Match an FSID from Flipnote Studio
     * e.g. 1440D700CEF78DA8
     * @internal
     */
    var REGEX_PPM_FSID = /^[0159]{1}[0-9A-F]{6}0[0-9A-F]{8}$/;
    /**
     * Match an FSID from Flipnote Studio 3D
     * e.g. 003f-0b7e-82a6-fe0bda
     * @internal
     */
    var REGEX_KWZ_FSID = /^[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{6}$/;
    /**
     * Match an FSID from a DSi Library note (PPM to KWZ conversion)
     * e.g. 10b8-b909-5180-9b2013
     * @internal
     */
    var REGEX_KWZ_DSI_LIBRARY_FSID = /^(00|10|12|14)[0-9a-f]{2}-[0-9a-f]{4}-[0-9a-f]{3}0-[0-9a-f]{4}[0159]{1}[0-9a-f]{1}$/;
    /**
     * Indicates whether the input is a valid Flipnote Studio user ID
     */
    function isPpmFsid(fsid) {
        return REGEX_PPM_FSID.test(fsid);
    }
    /**
     * Indicates whether the input is a valid Flipnote Studio 3D user ID
     */
    function isKwzFsid(fsid) {
        return REGEX_KWZ_FSID.test(fsid);
    }
    /**
     * Indicates whether the input is a valid DSi Library user ID
     */
    function isKwzDsiLibraryFsid(fsid) {
        return REGEX_KWZ_DSI_LIBRARY_FSID.test(fsid);
    }
    /**
     * Indicates whether the input is a valid Flipnote Studio or Flipnote Studio 3D user ID
     */
    function isFsid(fsid) {
        return isPpmFsid(fsid) || isKwzFsid(fsid);
    }
    /**
     * Get the region for any valid Flipnote Studio user ID
     */
    function getPpmFsidRegion(fsid) {
        switch (fsid.charAt(0)) {
            case '0':
            case '1':
                return exports.FlipnoteRegion.JPN;
            case '5':
                return exports.FlipnoteRegion.USA;
            case '9':
                return exports.FlipnoteRegion.EUR;
            default:
                return exports.FlipnoteRegion.UNKNOWN;
        }
    }
    /**
     * Get the region for any valid Flipnote Studio 3D user ID
     */
    function getKwzFsidRegion(fsid) {
        if (isKwzDsiLibraryFsid(fsid)) {
            switch (fsid.charAt(19)) {
                case '0':
                case '1':
                    return exports.FlipnoteRegion.JPN;
                case '5':
                    return exports.FlipnoteRegion.USA;
                case '9':
                    return exports.FlipnoteRegion.EUR;
                default:
                    return exports.FlipnoteRegion.UNKNOWN;
            }
        }
        switch (fsid.slice(0, 2)) {
            case '00':
                return exports.FlipnoteRegion.JPN;
            case '02':
                return exports.FlipnoteRegion.USA;
            case '04':
                return exports.FlipnoteRegion.EUR;
            default:
                return exports.FlipnoteRegion.UNKNOWN;
        }
    }
    /**
     * Get the region for any valid Flipnote Studio or Flipnote Studio 3D user ID
     */
    function getFsidRegion(fsid) {
        if (isPpmFsid(fsid))
            return getPpmFsidRegion(fsid);
        else if (isKwzFsid(fsid))
            return getKwzFsidRegion(fsid);
        return exports.FlipnoteRegion.UNKNOWN;
    }

    var fsid = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get FlipnoteRegion () { return exports.FlipnoteRegion; },
        isPpmFsid: isPpmFsid,
        isKwzFsid: isKwzFsid,
        isKwzDsiLibraryFsid: isKwzDsiLibraryFsid,
        isFsid: isFsid,
        getPpmFsidRegion: getPpmFsidRegion,
        getKwzFsidRegion: getKwzFsidRegion,
        getFsidRegion: getFsidRegion
    });

    /** @internal */
    var saveData = (function () {
        if (!isBrowser) {
            return function () { };
        }
        var a = document.createElement("a");
        // document.body.appendChild(a);
        // a.style.display = "none";
        return function (blob, filename) {
            var url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    })();

    (function (FlipnoteFormat) {
        /** Animation format used by Flipnote Studio (Nintendo DSiWare) */
        FlipnoteFormat["PPM"] = "PPM";
        /** Animation format used by Flipnote Studio 3D (Nintendo 3DS) */
        FlipnoteFormat["KWZ"] = "KWZ";
    })(exports.FlipnoteFormat || (exports.FlipnoteFormat = {}));
    (function (FlipnoteAudioTrack) {
        /** Background music track */
        FlipnoteAudioTrack[FlipnoteAudioTrack["BGM"] = 0] = "BGM";
        /** Sound effect 1 track */
        FlipnoteAudioTrack[FlipnoteAudioTrack["SE1"] = 1] = "SE1";
        /** Sound effect 2 track */
        FlipnoteAudioTrack[FlipnoteAudioTrack["SE2"] = 2] = "SE2";
        /** Sound effect 3 track */
        FlipnoteAudioTrack[FlipnoteAudioTrack["SE3"] = 3] = "SE3";
        /** Sound effect 4 track (only used by KWZ files) */
        FlipnoteAudioTrack[FlipnoteAudioTrack["SE4"] = 4] = "SE4";
    })(exports.FlipnoteAudioTrack || (exports.FlipnoteAudioTrack = {}));
    /**
     * Base Flipnote parser class
     *
     * This doesn't implement any parsing functionality itself,
     * it just provides a consistent API for every format parser to implement.
     * @category File Parser
    */
    var FlipnoteParser = /** @class */ (function (_super) {
        __extends(FlipnoteParser, _super);
        function FlipnoteParser() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /** (KWZ only) Indicates whether or not this file is a Flipnote Studio 3D folder icon */
            _this.isFolderIcon = false;
            /** (KWZ only) Indicates whether or not this file is a handwritten comment from Flipnote Gallery World */
            _this.isComment = false;
            /** (KWZ only) Indicates whether or not this Flipnote is a PPM to KWZ conversion from Flipnote Studio 3D's DSi Library service */
            _this.isDsiLibraryNote = false;
            return _this;
        }
        /**
         * Does an audio track exist in the Flipnote?
         * @category Audio
        */
        FlipnoteParser.prototype.hasAudioTrack = function (trackId) {
            return this.soundMeta.has(trackId) && this.soundMeta.get(trackId).length > 0;
        };
        return FlipnoteParser;
    }(DataStream));

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
    /**
     * PPM framerates in frames per second, indexed by the in-app frame speed.
     * Frame speed 0 is never noramally used
     */
    var PPM_FRAMERATES = [0.5, 0.5, 1, 2, 4, 6, 12, 20, 30];
    /**
     * PPM color defines (red, green, blue, alpha)
     */
    var PPM_PALETTE = {
        WHITE: [0xff, 0xff, 0xff, 0xff],
        BLACK: [0x0e, 0x0e, 0x0e, 0xff],
        RED: [0xff, 0x2a, 0x2a, 0xff],
        BLUE: [0x0a, 0x39, 0xff, 0xff]
    };
    /**
     * Parser class for (DSiWare) Flipnote Studio's PPM animation format.
     *
     * Format docs: https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format
     * @category File Parser
     */
    var PpmParser = /** @class */ (function (_super) {
        __extends(PpmParser, _super);
        /**
         * Create a new PPM file parser instance
         * @param arrayBuffer an ArrayBuffer containing file data
         * @param settings parser settings (none currently implemented)
         */
        function PpmParser(arrayBuffer, settings) {
            var _this = _super.call(this, arrayBuffer) || this;
            /** File format type, reflects {@link PpmParser.format} */
            _this.format = exports.FlipnoteFormat.PPM;
            /** Animation frame width, reflects {@link PpmParser.width} */
            _this.imageWidth = PpmParser.width;
            /** Animation frame height, reflects {@link PpmParser.height} */
            _this.imageHeight = PpmParser.height;
            /** X offset for the top-left corner of the animation frame */
            _this.imageOffsetX = 0;
            /** Y offset for the top-left corner of the animation frame */
            _this.imageOffsetY = 0;
            /** Number of animation frame layers, reflects {@link PpmParser.numLayers} */
            _this.numLayers = PpmParser.numLayers;
            /** Audio track base sample rate, reflects {@link PpmParser.rawSampleRate} */
            _this.rawSampleRate = PpmParser.rawSampleRate;
            /** Audio output sample rate, reflects {@link PpmParser.sampleRate} */
            _this.sampleRate = PpmParser.sampleRate;
            /** Global animation frame color palette, reflects {@link PpmParser.globalPalette} */
            _this.globalPalette = PpmParser.globalPalette;
            _this.prevDecodedFrame = null;
            _this.decodeHeader();
            _this.decodeAnimationHeader();
            _this.decodeSoundHeader();
            // this is always true afaik, it's likely just a remnant from development
            // doesn't hurt to be accurate though...
            if (((_this.version >> 4) & 0xf) !== 0) {
                _this.decodeMeta();
            }
            // create image buffers
            _this.layerBuffers = [
                new Uint8Array(PpmParser.width * PpmParser.height),
                new Uint8Array(PpmParser.width * PpmParser.height)
            ];
            _this.prevLayerBuffers = [
                new Uint8Array(PpmParser.width * PpmParser.height),
                new Uint8Array(PpmParser.width * PpmParser.height)
            ];
            _this.lineEncodingBuffers = [
                new Uint8Array(PpmParser.height),
                new Uint8Array(PpmParser.height)
            ];
            _this.prevDecodedFrame = null;
            return _this;
        }
        PpmParser.validateFSID = function (fsid) {
            return /[0159]{1}[0-9A-F]{6}0[0-9A-F]{8}/.test(fsid);
        };
        PpmParser.validateFilename = function (filename) {
            return /[0-9A-F]{6}_[0-9A-F]{13}_[0-9]{3}/.test(filename);
        };
        PpmParser.prototype.decodeHeader = function () {
            assert(16 < this.byteLength);
            this.seek(4);
            // decode header
            // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#header
            this.frameDataLength = this.readUint32();
            this.soundDataLength = this.readUint32();
            this.frameCount = this.readUint16() + 1;
            this.version = this.readUint16();
        };
        PpmParser.prototype.readFilename = function () {
            var mac = this.readHex(3);
            var random = this.readChars(13);
            var edits = this.readUint16().toString().padStart(3, '0');
            return mac + "_" + random + "_" + edits;
        };
        PpmParser.prototype.decodeMeta = function () {
            // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#metadata
            assert(0x06A8 < this.byteLength);
            this.seek(0x10);
            var lock = this.readUint16();
            var thumbIndex = this.readInt16();
            var rootAuthorName = this.readWideChars(11);
            var parentAuthorName = this.readWideChars(11);
            var currentAuthorName = this.readWideChars(11);
            var parentAuthorId = this.readHex(8, true);
            var currentAuthorId = this.readHex(8, true);
            var parentFilename = this.readFilename();
            var currentFilename = this.readFilename();
            var rootAuthorId = this.readHex(8, true);
            this.seek(0x9A);
            var timestamp = dateFromNintendoTimestamp(this.readInt32());
            this.seek(0x06A6);
            var flags = this.readUint16();
            this.thumbFrameIndex = thumbIndex;
            this.layerVisibility = {
                1: (flags & 0x10) === 0,
                2: (flags & 0x20) === 0,
                3: false
            };
            this.isSpinoff = (currentAuthorId !== parentAuthorId) || (currentAuthorId !== rootAuthorId);
            this.meta = {
                lock: lock === 1,
                loop: (flags >> 1 & 0x1) === 1,
                isSpinoff: this.isSpinoff,
                frameCount: this.frameCount,
                frameSpeed: this.frameSpeed,
                bgmSpeed: this.bgmSpeed,
                duration: this.duration,
                thumbIndex: thumbIndex,
                timestamp: timestamp,
                root: {
                    username: rootAuthorName,
                    fsid: rootAuthorId,
                    region: getPpmFsidRegion(rootAuthorId),
                    filename: null
                },
                parent: {
                    username: parentAuthorName,
                    fsid: parentAuthorId,
                    region: getPpmFsidRegion(parentAuthorId),
                    filename: parentFilename
                },
                current: {
                    username: currentAuthorName,
                    fsid: currentAuthorId,
                    region: getPpmFsidRegion(currentAuthorId),
                    filename: currentFilename
                },
            };
        };
        PpmParser.prototype.decodeAnimationHeader = function () {
            // jump to the start of the animation data section
            // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#animation-header
            this.seek(0x06A0);
            var offsetTableLength = this.readUint16();
            var numOffsets = offsetTableLength / 4;
            assert(numOffsets <= this.frameCount);
            // skip padding + flags
            this.seek(0x06A8);
            // read frame offsets and build them into a table
            var frameOffsets = new Uint32Array(numOffsets);
            for (var n = 0; n < numOffsets; n++) {
                var ptr = 0x06A8 + offsetTableLength + this.readUint32();
                assert(ptr < this.byteLength, "Frame " + n + " pointer is out of bounds");
                frameOffsets[n] = ptr;
            }
            this.frameOffsets = frameOffsets;
        };
        PpmParser.prototype.decodeSoundHeader = function () {
            // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#sound-header
            // offset = frame data offset + frame data length + sound effect flags
            var ptr = 0x06A0 + this.frameDataLength + this.frameCount;
            assert(ptr < this.byteLength);
            // align offset
            if (ptr % 4 != 0)
                ptr += 4 - (ptr % 4);
            this.seek(ptr);
            var bgmLen = this.readUint32();
            var se1Len = this.readUint32();
            var se2Len = this.readUint32();
            var se3Len = this.readUint32();
            this.frameSpeed = 8 - this.readUint8();
            this.bgmSpeed = 8 - this.readUint8();
            assert(this.frameSpeed <= 8 && this.bgmSpeed <= 8);
            ptr += 32;
            this.framerate = PPM_FRAMERATES[this.frameSpeed];
            this.duration = timeGetNoteDuration(this.frameCount, this.framerate);
            this.bgmrate = PPM_FRAMERATES[this.bgmSpeed];
            var soundMeta = new Map();
            soundMeta.set(exports.FlipnoteAudioTrack.BGM, { ptr: ptr, length: bgmLen });
            soundMeta.set(exports.FlipnoteAudioTrack.SE1, { ptr: ptr += bgmLen, length: se1Len });
            soundMeta.set(exports.FlipnoteAudioTrack.SE2, { ptr: ptr += se1Len, length: se2Len });
            soundMeta.set(exports.FlipnoteAudioTrack.SE3, { ptr: ptr += se2Len, length: se3Len });
            this.soundMeta = soundMeta;
        };
        PpmParser.prototype.isNewFrame = function (frameIndex) {
            this.seek(this.frameOffsets[frameIndex]);
            var header = this.readUint8();
            return (header >> 7) & 0x1;
        };
        /**
         * Decode a frame, returning the raw pixel buffers for each layer
         * @category Image
        */
        PpmParser.prototype.decodeFrame = function (frameIndex) {
            assert(frameIndex > -1 && frameIndex < this.frameCount, "Frame index " + frameIndex + " out of bounds");
            if (this.prevDecodedFrame !== frameIndex - 1 && (!this.isNewFrame(frameIndex)) && frameIndex !== 0)
                this.decodeFrame(frameIndex - 1);
            this.prevDecodedFrame = frameIndex;
            // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#animation-data
            this.seek(this.frameOffsets[frameIndex]);
            var header = this.readUint8();
            var isNewFrame = (header >> 7) & 0x1;
            var isTranslated = (header >> 5) & 0x3;
            // reset current layer buffers
            this.layerBuffers[0].fill(0);
            this.layerBuffers[1].fill(0);
            var translateX = 0;
            var translateY = 0;
            if (isTranslated) {
                translateX = this.readInt8();
                translateY = this.readInt8();
            }
            // unpack line encodings for each layer
            for (var layerIndex = 0; layerIndex < 2; layerIndex++) {
                var lineEncodingBuffer = this.lineEncodingBuffers[layerIndex];
                lineEncodingBuffer.fill(0);
                for (var ptr = 0; ptr < lineEncodingBuffer.length;) {
                    var byte = this.readUint8();
                    // the 4 lines in this byte are all empty (type 0) - skip
                    if (byte === 0) {
                        ptr += 4;
                        continue;
                    }
                    // unpack 4 line types from the current byte
                    lineEncodingBuffer[ptr++] = byte & 0x03;
                    lineEncodingBuffer[ptr++] = (byte >> 2) & 0x03;
                    lineEncodingBuffer[ptr++] = (byte >> 4) & 0x03;
                    lineEncodingBuffer[ptr++] = (byte >> 6) & 0x03;
                }
            }
            // unpack layer bitmaps
            for (var layerIndex = 0; layerIndex < 2; layerIndex++) {
                var pixelBuffer = this.layerBuffers[layerIndex];
                var lineEncodingBuffer = this.lineEncodingBuffers[layerIndex];
                for (var y = 0; y < PpmParser.height; y++) {
                    var pixelBufferPtr = y * PpmParser.width;
                    var lineType = lineEncodingBuffer[y];
                    switch (lineType) {
                        // line type 0 = blank line, decode nothing
                        case 0:
                            break;
                        // line type 1 = compressed bitmap line
                        case 1:
                            // read lineHeader as a big-endian int
                            var lineHeader = this.readUint32(false);
                            // loop through each bit in the line header
                            // shift lineheader to the left by 1 bit every interation, 
                            // so on the next loop cycle the next bit will be checked
                            // and if the line header equals 0, no more bits are set, 
                            // the rest of the line is empty and can be skipped
                            for (; lineHeader !== 0; lineHeader <<= 1, pixelBufferPtr += 8) {
                                // if the bit is set, this 8-pix wide chunk is stored
                                // else we can just leave it blank and move on to the next chunk
                                if (lineHeader & 0x80000000) {
                                    var chunk = this.readUint8();
                                    // unpack chunk bits
                                    // the chunk if shifted right 1 bit on every loop
                                    // if the chunk equals 0, no more bits are set, 
                                    // so the rest of the chunk is empty and can be skipped
                                    for (var pixel = 0; chunk !== 0; pixel++, chunk >>= 1)
                                        pixelBuffer[pixelBufferPtr + pixel] = chunk & 0x1;
                                }
                            }
                            break;
                        // line type 2 = compressed bitmap line like type 1, but all pixels are set to 1 first
                        case 2:
                            // line type 2 starts as an inverted line
                            pixelBuffer.fill(1, pixelBufferPtr, pixelBufferPtr + PpmParser.width);
                            // read lineHeader as a big-endian int
                            var lineHeader = this.readUint32(false);
                            // loop through each bit in the line header
                            // shift lineheader to the left by 1 bit every interation, 
                            // so on the next loop cycle the next bit will be checked
                            // and if the line header equals 0, no more bits are set, 
                            // the rest of the line is empty and can be skipped
                            for (; lineHeader !== 0; lineHeader <<= 1, pixelBufferPtr += 8) {
                                // if the bit is set, this 8-pix wide chunk is stored
                                // else we can just leave it blank and move on to the next chunk
                                if (lineHeader & 0x80000000) {
                                    var chunk = this.readUint8();
                                    // unpack chunk bits
                                    for (var pixel = 0; pixel < 8; pixel++, chunk >>= 1)
                                        pixelBuffer[pixelBufferPtr + pixel] = chunk & 0x1;
                                }
                            }
                            break;
                        // line type 3 = raw bitmap line
                        case 3:
                            for (var chunk = 0, i = 0; i < PpmParser.width; i++) {
                                if (i % 8 === 0)
                                    chunk = this.readUint8();
                                pixelBuffer[pixelBufferPtr++] = chunk & 0x1;
                                chunk >>= 1;
                            }
                            break;
                    }
                }
            }
            // if the current frame is based on changes from the preivous one, merge them by XORing their values
            var layer1 = this.layerBuffers[0];
            var layer2 = this.layerBuffers[1];
            var layer1Prev = this.prevLayerBuffers[0];
            var layer2Prev = this.prevLayerBuffers[1];
            if (!isNewFrame) {
                var dest = void 0, src = void 0;
                // loop through each line
                for (var y = 0; y < PpmParser.height; y++) {
                    // skip to next line if this one falls off the top edge of the screen
                    if (y - translateY < 0)
                        continue;
                    // stop once the bottom screen edge has been reached
                    if (y - translateY >= PpmParser.height)
                        break;
                    // loop through each pixel in the line
                    for (var x = 0; x < PpmParser.width; x++) {
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
            this.prevLayerBuffers[0].set(this.layerBuffers[0]);
            this.prevLayerBuffers[1].set(this.layerBuffers[1]);
            return this.layerBuffers;
        };
        /**
         * Get the layer draw order for a given frame
         * @category Image
         * @returns Array of layer indexes, in the order they should be drawn
        */
        PpmParser.prototype.getFrameLayerOrder = function (frameIndex) {
            return [0, 1];
        };
        /**
         * Get the color palette indices for a given frame. RGBA colors for these values can be indexed from {@link PpmParser.globalPalette}
         *
         * Returns an array where:
         *  - index 0 is the paper color index
         *  - index 1 is the layer 1 color index
         *  - index 2 is the layer 2 color index
         * @category Image
        */
        PpmParser.prototype.getFramePaletteIndices = function (frameIndex) {
            this.seek(this.frameOffsets[frameIndex]);
            var header = this.readUint8();
            var isInverted = (header & 0x1) !== 1;
            var penMap = [
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
        };
        /**
         * Get the RGBA colors for a given frame
         *
         * Returns an array where:
         *  - index 0 is the paper color
         *  - index 1 is the layer 1 color
         *  - index 2 is the layer 2 color
         * @category Image
         */
        PpmParser.prototype.getFramePalette = function (frameIndex) {
            var _this = this;
            var indices = this.getFramePaletteIndices(frameIndex);
            return indices.map(function (colorIndex) { return _this.globalPalette[colorIndex]; });
        };
        /**
         * Get the pixels for a given frame layer
         * @category Image
        */
        PpmParser.prototype.getLayerPixels = function (frameIndex, layerIndex) {
            if (this.prevDecodedFrame !== frameIndex) {
                this.decodeFrame(frameIndex);
            }
            var palette = this.getFramePaletteIndices(frameIndex);
            var layer = this.layerBuffers[layerIndex];
            var image = new Uint8Array(PpmParser.width * PpmParser.height);
            var layerColor = palette[layerIndex + 1];
            for (var pixel = 0; pixel < image.length; pixel++) {
                if (layer[pixel] === 1)
                    image[pixel] = layerColor;
            }
            return image;
        };
        /**
         * Get the pixels for a given frame
         * @category Image
        */
        PpmParser.prototype.getFramePixels = function (frameIndex) {
            var palette = this.getFramePaletteIndices(frameIndex);
            var layers = this.decodeFrame(frameIndex);
            var image = new Uint8Array(PpmParser.width * PpmParser.height);
            var layer1 = layers[0];
            var layer2 = layers[1];
            var paperColor = palette[0];
            var layer1Color = palette[1];
            var layer2Color = palette[2];
            image.fill(paperColor);
            for (var pixel = 0; pixel < image.length; pixel++) {
                var a = layer1[pixel];
                var b = layer2[pixel];
                if (a === 1)
                    image[pixel] = layer1Color;
                else if (b === 1)
                    image[pixel] = layer2Color;
            }
            return image;
        };
        /**
         * Get the sound effect flags for every frame in the Flipnote
         * @category Audio
        */
        PpmParser.prototype.decodeSoundFlags = function () {
            assert(0x06A0 + this.frameDataLength < this.byteLength);
            // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#sound-effect-flags
            this.seek(0x06A0 + this.frameDataLength);
            var numFlags = this.frameCount;
            var flags = this.readBytes(numFlags);
            var unpacked = new Array(numFlags);
            for (var i = 0; i < numFlags; i++) {
                var byte = flags[i];
                unpacked[i] = [
                    (byte & 0x1) !== 0,
                    (byte & 0x2) !== 0,
                    (byte & 0x4) !== 0,
                ];
            }
            return unpacked;
        };
        /**
         * Get the raw compressed audio data for a given track
         * @returns byte array
         * @category Audio
        */
        PpmParser.prototype.getAudioTrackRaw = function (trackId) {
            var trackMeta = this.soundMeta.get(trackId);
            assert(trackMeta.ptr + trackMeta.length < this.byteLength);
            this.seek(trackMeta.ptr);
            return this.readBytes(trackMeta.length);
        };
        /**
         * Get the decoded audio data for a given track, using the track's native samplerate
         * @returns Signed 16-bit PCM audio
         * @category Audio
        */
        PpmParser.prototype.decodeAudioTrack = function (trackId) {
            // note this doesn't resample
            // TODO: kinda slow, maybe use sample lookup table
            // decode a 4 bit IMA adpcm audio track
            // https://github.com/Flipnote-Collective/flipnote-studio-docs/wiki/PPM-format#sound-data
            var src = this.getAudioTrackRaw(trackId);
            var srcSize = src.length;
            var dst = new Int16Array(srcSize * 2);
            var srcPtr = 0;
            var dstPtr = 0;
            var sample = 0;
            var stepIndex = 0;
            var predictor = 0;
            var lowNibble = true;
            while (srcPtr < srcSize) {
                // switch between high and low nibble each loop iteration
                // increments srcPtr after every high nibble
                if (lowNibble)
                    sample = src[srcPtr] & 0xF;
                else
                    sample = src[srcPtr++] >> 4;
                lowNibble = !lowNibble;
                var step = ADPCM_STEP_TABLE[stepIndex];
                var diff = step >> 3;
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
        };
        /**
         * Get the decoded audio data for a given track, using the specified samplerate
         * @returns Signed 16-bit PCM audio
         * @category Audio
        */
        PpmParser.prototype.getAudioTrackPcm = function (trackId, dstFreq) {
            if (dstFreq === void 0) { dstFreq = this.sampleRate; }
            var srcPcm = this.decodeAudioTrack(trackId);
            var srcFreq = this.rawSampleRate;
            if (trackId === exports.FlipnoteAudioTrack.BGM) {
                var bgmAdjust = (1 / this.bgmrate) / (1 / this.framerate);
                srcFreq = this.rawSampleRate * bgmAdjust;
            }
            if (srcFreq !== dstFreq)
                return pcmResampleNearestNeighbour(srcPcm, srcFreq, dstFreq);
            return srcPcm;
        };
        PpmParser.prototype.pcmAudioMix = function (src, dst, dstOffset) {
            if (dstOffset === void 0) { dstOffset = 0; }
            var srcSize = src.length;
            var dstSize = dst.length;
            for (var n = 0; n < srcSize; n++) {
                if (dstOffset + n > dstSize)
                    break;
                // half src volume
                var samp = dst[dstOffset + n] + (src[n] / 2);
                dst[dstOffset + n] = clamp(samp, -32768, 32767);
            }
        };
        /**
         * Get the full mixed audio for the Flipnote, using the specified samplerate
         * @returns Signed 16-bit PCM audio
         * @category Audio
        */
        PpmParser.prototype.getAudioMasterPcm = function (dstFreq) {
            if (dstFreq === void 0) { dstFreq = this.sampleRate; }
            var dstSize = Math.ceil(this.duration * dstFreq);
            var master = new Int16Array(dstSize);
            var hasBgm = this.hasAudioTrack(exports.FlipnoteAudioTrack.BGM);
            var hasSe1 = this.hasAudioTrack(exports.FlipnoteAudioTrack.SE1);
            var hasSe2 = this.hasAudioTrack(exports.FlipnoteAudioTrack.SE2);
            var hasSe3 = this.hasAudioTrack(exports.FlipnoteAudioTrack.SE3);
            // Mix background music
            if (hasBgm) {
                var bgmPcm = this.getAudioTrackPcm(exports.FlipnoteAudioTrack.BGM, dstFreq);
                this.pcmAudioMix(bgmPcm, master, 0);
            }
            // Mix sound effects
            if (hasSe1 || hasSe2 || hasSe3) {
                var samplesPerFrame = dstFreq / this.framerate;
                var se1Pcm = hasSe1 ? this.getAudioTrackPcm(exports.FlipnoteAudioTrack.SE1, dstFreq) : null;
                var se2Pcm = hasSe2 ? this.getAudioTrackPcm(exports.FlipnoteAudioTrack.SE2, dstFreq) : null;
                var se3Pcm = hasSe3 ? this.getAudioTrackPcm(exports.FlipnoteAudioTrack.SE3, dstFreq) : null;
                var seFlags = this.decodeSoundFlags();
                for (var frame = 0; frame < this.frameCount; frame++) {
                    var seOffset = Math.ceil(frame * samplesPerFrame);
                    var flag = seFlags[frame];
                    if (hasSe1 && flag[0])
                        this.pcmAudioMix(se1Pcm, master, seOffset);
                    if (hasSe2 && flag[1])
                        this.pcmAudioMix(se2Pcm, master, seOffset);
                    if (hasSe3 && flag[2])
                        this.pcmAudioMix(se3Pcm, master, seOffset);
                }
            }
            this.audioClipRatio = pcmGetClippingRatio(master);
            return master;
        };
        /** Default PPM parser settings */
        PpmParser.defaultSettings = {};
        /** File format type */
        PpmParser.format = exports.FlipnoteFormat.PPM;
        /** Animation frame width */
        PpmParser.width = 256;
        /** Animation frame height */
        PpmParser.height = 192;
        /** Number of animation frame layers */
        PpmParser.numLayers = 2;
        /** Audio track base sample rate */
        PpmParser.rawSampleRate = 8192;
        /** Nintendo DSi audio output rate */
        PpmParser.sampleRate = 32768;
        /** Global animation frame color palette */
        PpmParser.globalPalette = [
            PPM_PALETTE.WHITE,
            PPM_PALETTE.BLACK,
            PPM_PALETTE.RED,
            PPM_PALETTE.BLUE
        ];
        return PpmParser;
    }(FlipnoteParser));

    /**
     * KWZ framerates in frames per second, indexed by the in-app frame speed
     */
    var KWZ_FRAMERATES = [.2, .5, 1, 2, 4, 6, 8, 12, 20, 24, 30];
    /**
     * KWZ color defines (red, green, blue, alpha)
     */
    var KWZ_PALETTE = {
        WHITE: [0xff, 0xff, 0xff, 0xff],
        BLACK: [0x10, 0x10, 0x10, 0xff],
        RED: [0xff, 0x10, 0x10, 0xff],
        YELLOW: [0xff, 0xe7, 0x00, 0xff],
        GREEN: [0x00, 0x86, 0x31, 0xff],
        BLUE: [0x00, 0x38, 0xce, 0xff],
        NONE: [0xff, 0xff, 0xff, 0x00]
    };
    /**
     * Pre computed bitmasks for readBits; done as a slight optimisation
     * @internal
     */
    var BITMASKS = new Uint16Array(16);
    for (var i = 0; i < 16; i++) {
        BITMASKS[i] = (1 << i) - 1;
    }
    /**
     * Every possible sequence of pixels for each 8-pixel line
     * @internal
     */
    var KWZ_LINE_TABLE = new Uint8Array(6561 * 8);
    /**
     * Same lines as KWZ_LINE_TABLE, but the pixels are shift-rotated to the left by one place
     * @internal
     */
    var KWZ_LINE_TABLE_SHIFT = new Uint8Array(6561 * 8);
    /** @internal */
    var offset = 0;
    for (var a = 0; a < 3; a++)
        for (var b = 0; b < 3; b++)
            for (var c = 0; c < 3; c++)
                for (var d = 0; d < 3; d++)
                    for (var e = 0; e < 3; e++)
                        for (var f = 0; f < 3; f++)
                            for (var g = 0; g < 3; g++)
                                for (var h = 0; h < 3; h++) {
                                    KWZ_LINE_TABLE.set([b, a, d, c, f, e, h, g], offset);
                                    KWZ_LINE_TABLE_SHIFT.set([a, d, c, f, e, h, g, b], offset);
                                    offset += 8;
                                }
    /**
     * Commonly used lines - represents lines where all the pixels are empty, full,
     * or include a pattern produced by the paint tool, etc
     * @internal
     */
    var KWZ_LINE_TABLE_COMMON = new Uint8Array(32 * 8);
    /**
     * Same lines as common line table, but shift-rotates one place to the left
     * @internal
     */
    var KWZ_LINE_TABLE_COMMON_SHIFT = new Uint8Array(32 * 8);
    [
        0x0000, 0x0CD0, 0x19A0, 0x02D9, 0x088B, 0x0051, 0x00F3, 0x0009,
        0x001B, 0x0001, 0x0003, 0x05B2, 0x1116, 0x00A2, 0x01E6, 0x0012,
        0x0036, 0x0002, 0x0006, 0x0B64, 0x08DC, 0x0144, 0x00FC, 0x0024,
        0x001C, 0x0004, 0x0334, 0x099C, 0x0668, 0x1338, 0x1004, 0x166C
    ].forEach(function (value, i) {
        var lineTablePtr = value * 8;
        var pixels = KWZ_LINE_TABLE.subarray(lineTablePtr, lineTablePtr + 8);
        var shiftPixels = KWZ_LINE_TABLE_SHIFT.subarray(lineTablePtr, lineTablePtr + 8);
        KWZ_LINE_TABLE_COMMON.set(pixels, i * 8);
        KWZ_LINE_TABLE_COMMON_SHIFT.set(shiftPixels, i * 8);
    });
    /**
     * Parser class for Flipnote Studio 3D's KWZ animation format
     *
     * KWZ format docs: https://github.com/Flipnote-Collective/flipnote-studio-3d-docs/wiki/KWZ-Format
     * @category File Parser
     */
    var KwzParser = /** @class */ (function (_super) {
        __extends(KwzParser, _super);
        /**
         * Create a new KWZ file parser instance
         * @param arrayBuffer an ArrayBuffer containing file data
         * @param settings parser settings
         */
        function KwzParser(arrayBuffer, settings) {
            if (settings === void 0) { settings = {}; }
            var _this = _super.call(this, arrayBuffer) || this;
            /** File format type, reflects {@link KwzParser.format} */
            _this.format = exports.FlipnoteFormat.KWZ;
            /** Animation frame width, reflects {@link KwzParser.width} */
            _this.imageWidth = KwzParser.width;
            /** Animation frame height, reflects {@link KwzParser.height} */
            _this.imageHeight = KwzParser.height;
            /** X offset for the top-left corner of the animation frame */
            _this.imageOffsetX = 0;
            /** Y offset for the top-left corner of the animation frame */
            _this.imageOffsetY = 0;
            /** Number of animation frame layers, reflects {@link KwzParser.numLayers} */
            _this.numLayers = KwzParser.numLayers;
            /** Audio track base sample rate, reflects {@link KwzParser.rawSampleRate} */
            _this.rawSampleRate = KwzParser.rawSampleRate;
            /** Audio output sample rate, reflects {@link KwzParser.sampleRate} */
            _this.sampleRate = KwzParser.sampleRate;
            /** Global animation frame color palette, reflects {@link KwzParser.globalPalette} */
            _this.globalPalette = KwzParser.globalPalette;
            _this.prevFrameIndex = null;
            _this.bitIndex = 0;
            _this.bitValue = 0;
            _this.settings = __assign(__assign({}, KwzParser.defaultSettings), settings);
            _this.buildSectionMap();
            _this.layers = [
                new Uint8Array(KwzParser.width * KwzParser.height),
                new Uint8Array(KwzParser.width * KwzParser.height),
                new Uint8Array(KwzParser.width * KwzParser.height),
            ];
            // if the KIC section is present, we're dealing with a folder icon
            // these are single-frame KWZs without a KFH section for metadata, or a KSN section for sound
            // while the data for a full frame (320*240) is present, only the top-left 24*24 pixels are used
            if (_this.sectionMap.has('KIC')) {
                _this.isFolderIcon = true;
                // icons still use the full 320 * 240 frame size, so we just set up our image crop to deal with that
                _this.imageWidth = 24;
                _this.imageHeight = 24;
                _this.frameCount = 1;
                _this.frameSpeed = 0;
                _this.framerate = KWZ_FRAMERATES[0];
                _this.thumbFrameIndex = 0;
                _this.getFrameOffsets();
            }
            // if the KFH section is present, then this is a handwritten comment from the Flipnote Gallery World online service
            // these are single-frame KWZs, just with no sound
            else if (!_this.sectionMap.has('KSN')) {
                _this.isComment = true;
                _this.decodeMeta();
                _this.getFrameOffsets();
            }
            // else let's assume this is a regular note
            else {
                _this.decodeMeta();
                _this.getFrameOffsets();
                _this.decodeSoundHeader();
            }
            // apply special optimisations for converted DSi library notes
            if (_this.settings.dsiLibraryNote) {
                _this.isDsiLibraryNote = true;
            }
            // automatically crop out the border around every frame
            if (_this.settings.borderCrop) {
                // dsi library notes can be cropped to their original resolution
                if (_this.isDsiLibraryNote) {
                    _this.imageOffsetX = 32;
                    _this.imageOffsetY = 24;
                    _this.imageWidth = 256;
                    _this.imageHeight = 192;
                }
                // even standard notes have a bit of a border...
                else if (!_this.isFolderIcon) {
                    _this.imageOffsetX = 5;
                    _this.imageOffsetY = 5;
                    _this.imageWidth = 310;
                    _this.imageHeight = 230;
                }
            }
            return _this;
        }
        KwzParser.prototype.buildSectionMap = function () {
            this.seek(0);
            var fileSize = this.byteLength - 256;
            var sectionMap = new Map();
            var sectionCount = 0;
            var ptr = 0;
            // counting sections should mitigate against one of mrnbayoh's notehax exploits
            while (ptr < fileSize && sectionCount < 6) {
                this.seek(ptr);
                var magic = this.readChars(4).substring(0, 3);
                var length_1 = this.readUint32();
                sectionMap.set(magic, { ptr: ptr, length: length_1 });
                ptr += length_1 + 8;
                sectionCount += 1;
            }
            this.sectionMap = sectionMap;
            assert(sectionMap.has('KMC') && sectionMap.has('KMI'));
        };
        KwzParser.prototype.readBits = function (num) {
            // assert(num < 16);
            if (this.bitIndex + num > 16) {
                var nextBits = this.readUint16();
                this.bitValue |= nextBits << (16 - this.bitIndex);
                this.bitIndex -= 16;
            }
            var result = this.bitValue & BITMASKS[num];
            this.bitValue >>= num;
            this.bitIndex += num;
            return result;
        };
        KwzParser.prototype.readFsid = function () {
            if (this.settings.dsiLibraryNote) { // format as DSi PPM FSID
                var hex_1 = this.readHex(10, true);
                return hex_1.slice(2, 18);
            }
            var hex = this.readHex(10);
            return (hex.slice(0, 4) + "-" + hex.slice(4, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 18)).toLowerCase();
        };
        KwzParser.prototype.readFilename = function () {
            var ptr = this.pointer;
            var chars = this.readChars(28);
            if (chars.length === 28)
                return chars;
            // Otherwise, this is likely a DSi Library note, 
            // where sometimes Nintendo's buggy PPM converter includes the original packed PPM filename
            this.seek(ptr);
            var mac = this.readHex(3);
            var random = this.readChars(13);
            var edits = this.readUint16().toString().padStart(3, '0');
            this.seek(ptr + 28);
            return mac + "_" + random + "_" + edits;
        };
        KwzParser.prototype.decodeMeta = function () {
            if (this.settings.quickMeta)
                return this.decodeMetaQuick();
            assert(this.sectionMap.has('KFH'));
            this.seek(this.sectionMap.get('KFH').ptr + 12);
            var creationTime = dateFromNintendoTimestamp(this.readUint32());
            var modifiedTime = dateFromNintendoTimestamp(this.readUint32());
            // const simonTime = 
            var appVersion = this.readUint32();
            var rootAuthorId = this.readFsid();
            var parentAuthorId = this.readFsid();
            var currentAuthorId = this.readFsid();
            var rootAuthorName = this.readWideChars(11);
            var parentAuthorName = this.readWideChars(11);
            var currentAuthorName = this.readWideChars(11);
            var rootFilename = this.readFilename();
            var parentFilename = this.readFilename();
            var currentFilename = this.readFilename();
            var frameCount = this.readUint16();
            var thumbIndex = this.readUint16();
            var flags = this.readUint16();
            var frameSpeed = this.readUint8();
            var layerFlags = this.readUint8();
            this.isSpinoff = (currentAuthorId !== parentAuthorId) || (currentAuthorId !== rootAuthorId);
            this.frameCount = frameCount;
            this.frameSpeed = frameSpeed;
            this.framerate = KWZ_FRAMERATES[frameSpeed];
            this.duration = timeGetNoteDuration(this.frameCount, this.framerate);
            this.thumbFrameIndex = thumbIndex;
            this.layerVisibility = {
                1: (layerFlags & 0x1) === 0,
                2: (layerFlags & 0x2) === 0,
                3: (layerFlags & 0x3) === 0,
            };
            // Try to auto-detect whether the current author ID matches a converted PPM ID
            if (isKwzDsiLibraryFsid(currentAuthorId)) {
                this.isDsiLibraryNote = true;
            }
            this.meta = {
                lock: (flags & 0x1) !== 0,
                loop: (flags & 0x2) !== 0,
                isSpinoff: this.isSpinoff,
                frameCount: frameCount,
                frameSpeed: frameSpeed,
                duration: this.duration,
                thumbIndex: thumbIndex,
                timestamp: modifiedTime,
                creationTimestamp: creationTime,
                root: {
                    username: rootAuthorName,
                    fsid: rootAuthorId,
                    region: getKwzFsidRegion(rootAuthorId),
                    filename: rootFilename,
                    isDsiFilename: rootFilename.length !== 28
                },
                parent: {
                    username: parentAuthorName,
                    fsid: parentAuthorId,
                    region: getKwzFsidRegion(parentAuthorId),
                    filename: parentFilename,
                    isDsiFilename: parentFilename.length !== 28
                },
                current: {
                    username: currentAuthorName,
                    fsid: currentAuthorId,
                    region: getKwzFsidRegion(currentAuthorId),
                    filename: currentFilename,
                    isDsiFilename: currentFilename.length !== 28
                },
            };
        };
        KwzParser.prototype.decodeMetaQuick = function () {
            assert(this.sectionMap.has('KFH'));
            this.seek(this.sectionMap.get('KFH').ptr + 0x8 + 0xC4);
            var frameCount = this.readUint16();
            var thumbFrameIndex = this.readUint16();
            var flags = this.readUint16();
            var frameSpeed = this.readUint8();
            var layerFlags = this.readUint8();
            this.frameCount = frameCount;
            this.thumbFrameIndex = thumbFrameIndex;
            this.frameSpeed = frameSpeed;
            this.framerate = KWZ_FRAMERATES[frameSpeed];
            this.duration = timeGetNoteDuration(this.frameCount, this.framerate);
            this.layerVisibility = {
                1: (layerFlags & 0x1) === 0,
                2: (layerFlags & 0x2) === 0,
                3: (layerFlags & 0x3) === 0,
            };
        };
        KwzParser.prototype.getFrameOffsets = function () {
            assert(this.sectionMap.has('KMI') && this.sectionMap.has('KMC'));
            var numFrames = this.frameCount;
            var kmiSection = this.sectionMap.get('KMI');
            var kmcSection = this.sectionMap.get('KMC');
            assert(kmiSection.length / 28 >= numFrames);
            var frameMetaOffsets = new Uint32Array(numFrames);
            var frameDataOffsets = new Uint32Array(numFrames);
            var frameLayerSizes = [];
            var frameMetaPtr = kmiSection.ptr + 8;
            var frameDataPtr = kmcSection.ptr + 12;
            for (var frameIndex = 0; frameIndex < numFrames; frameIndex++) {
                this.seek(frameMetaPtr + 4);
                var layerASize = this.readUint16();
                var layerBSize = this.readUint16();
                var layerCSize = this.readUint16();
                frameMetaOffsets[frameIndex] = frameMetaPtr;
                frameDataOffsets[frameIndex] = frameDataPtr;
                frameMetaPtr += 28;
                frameDataPtr += layerASize + layerBSize + layerCSize;
                assert(frameMetaPtr < this.byteLength, "frame" + frameIndex + " meta pointer out of bounds");
                assert(frameDataPtr < this.byteLength, "frame" + frameIndex + " data pointer out of bounds");
                frameLayerSizes.push([layerASize, layerBSize, layerCSize]);
            }
            this.frameMetaOffsets = frameMetaOffsets;
            this.frameDataOffsets = frameDataOffsets;
            this.frameLayerSizes = frameLayerSizes;
        };
        KwzParser.prototype.decodeSoundHeader = function () {
            assert(this.sectionMap.has('KSN'));
            var ptr = this.sectionMap.get('KSN').ptr + 8;
            this.seek(ptr);
            this.bgmSpeed = this.readUint32();
            assert(this.bgmSpeed <= 10);
            this.bgmrate = KWZ_FRAMERATES[this.bgmSpeed];
            var trackSizes = new Uint32Array(this.buffer, ptr + 4, 20);
            var soundMeta = new Map();
            soundMeta.set(exports.FlipnoteAudioTrack.BGM, { ptr: ptr += 28, length: trackSizes[0] });
            soundMeta.set(exports.FlipnoteAudioTrack.SE1, { ptr: ptr += trackSizes[0], length: trackSizes[1] });
            soundMeta.set(exports.FlipnoteAudioTrack.SE2, { ptr: ptr += trackSizes[1], length: trackSizes[2] });
            soundMeta.set(exports.FlipnoteAudioTrack.SE3, { ptr: ptr += trackSizes[2], length: trackSizes[3] });
            soundMeta.set(exports.FlipnoteAudioTrack.SE4, { ptr: ptr += trackSizes[3], length: trackSizes[4] });
            this.soundMeta = soundMeta;
        };
        /**
         * Get the color palette indices for a given frame. RGBA colors for these values can be indexed from {@link KwzParser.globalPalette}
         *
         * Returns an array where:
         *  - index 0 is the paper color index
         *  - index 1 is the layer A color 1 index
         *  - index 2 is the layer A color 2 index
         *  - index 3 is the layer B color 1 index
         *  - index 4 is the layer B color 2 index
         *  - index 5 is the layer C color 1 index
         *  - index 6 is the layer C color 2 index
         * @category Image
        */
        KwzParser.prototype.getFramePaletteIndices = function (frameIndex) {
            this.seek(this.frameMetaOffsets[frameIndex]);
            var flags = this.readUint32();
            return [
                flags & 0xF,
                (flags >> 8) & 0xF,
                (flags >> 12) & 0xF,
                (flags >> 16) & 0xF,
                (flags >> 20) & 0xF,
                (flags >> 24) & 0xF,
                (flags >> 28) & 0xF,
            ];
        };
        /**
         * Get the RGBA colors for a given frame
         *
         * Returns an array where:
         *  - index 0 is the paper color
         *  - index 1 is the layer A color 1
         *  - index 2 is the layer A color 2
         *  - index 3 is the layer B color 1
         *  - index 4 is the layer B color 2
         *  - index 5 is the layer C color 1
         *  - index 6 is the layer C color 2
         * @category Image
        */
        KwzParser.prototype.getFramePalette = function (frameIndex) {
            var _this = this;
            var indices = this.getFramePaletteIndices(frameIndex);
            return indices.map(function (colorIndex) { return _this.globalPalette[colorIndex]; });
        };
        KwzParser.prototype.getFrameDiffingFlag = function (frameIndex) {
            this.seek(this.frameMetaOffsets[frameIndex]);
            var flags = this.readUint32();
            return (flags >> 4) & 0x07;
        };
        KwzParser.prototype.getFrameLayerSizes = function (frameIndex) {
            this.seek(this.frameMetaOffsets[frameIndex] + 0x4);
            return [
                this.readUint16(),
                this.readUint16(),
                this.readUint16()
            ];
        };
        KwzParser.prototype.getFrameLayerDepths = function (frameIndex) {
            this.seek(this.frameMetaOffsets[frameIndex] + 0x14);
            return [
                this.readUint8(),
                this.readUint8(),
                this.readUint8()
            ];
        };
        KwzParser.prototype.getFrameAuthor = function (frameIndex) {
            this.seek(this.frameMetaOffsets[frameIndex] + 0xA);
            return this.readHex(10);
        };
        KwzParser.prototype.getFrameSoundFlags = function (frameIndex) {
            this.seek(this.frameMetaOffsets[frameIndex] + 0x17);
            var soundFlags = this.readUint8();
            return [
                (soundFlags & 0x1) !== 0,
                (soundFlags & 0x2) !== 0,
                (soundFlags & 0x4) !== 0,
                (soundFlags & 0x8) !== 0,
            ];
        };
        KwzParser.prototype.getFrameCameraFlags = function (frameIndex) {
            this.seek(this.frameMetaOffsets[frameIndex] + 0x1A);
            var cameraFlags = this.readUint8();
            return [
                (cameraFlags & 0x1) !== 0,
                (cameraFlags & 0x2) !== 0,
                (cameraFlags & 0x4) !== 0,
            ];
        };
        /**
         * Get the layer draw order for a given frame
         * @category Image
         * @returns Array of layer indexes, in the order they should be drawn
        */
        KwzParser.prototype.getFrameLayerOrder = function (frameIndex) {
            var depths = this.getFrameLayerDepths(frameIndex);
            return [2, 1, 0].sort(function (a, b) { return depths[b] - depths[a]; });
        };
        /**
         * Decode a frame, returning the raw pixel buffers for each layer
         * @category Image
        */
        KwzParser.prototype.decodeFrame = function (frameIndex, diffingFlag, isPrevFrame) {
            if (diffingFlag === void 0) { diffingFlag = 0x7; }
            if (isPrevFrame === void 0) { isPrevFrame = false; }
            assert(frameIndex > -1 && frameIndex < this.frameCount, "Frame index " + frameIndex + " out of bounds");
            // the prevDecodedFrame check is an optimisation for decoding frames in full sequence
            if (this.prevFrameIndex !== frameIndex - 1 && frameIndex !== 0) {
                // if this frame is being decoded as a prev frame, then we only want to decode the layers necessary
                // diffingFlag is negated with ~ so if no layers are diff-based, diffingFlag is 0
                if (isPrevFrame)
                    diffingFlag = diffingFlag & ~this.getFrameDiffingFlag(frameIndex + 1);
                // if diffing flag isn't 0, decode the previous frame before this one
                if (diffingFlag !== 0)
                    this.decodeFrame(frameIndex - 1, diffingFlag, true);
            }
            var framePtr = this.frameDataOffsets[frameIndex];
            var layerSizes = this.frameLayerSizes[frameIndex];
            for (var layerIndex = 0; layerIndex < 3; layerIndex++) {
                // dsi gallery conversions don't use the third layer, so it can be skipped if this is set
                if (this.settings.dsiLibraryNote && layerIndex === 3)
                    break;
                this.seek(framePtr);
                var layerSize = layerSizes[layerIndex];
                framePtr += layerSize;
                var pixelBuffer = this.layers[layerIndex];
                // if the layer is 38 bytes then it hasn't changed at all since the previous frame, so we can skip it
                if (layerSize === 38)
                    continue;
                // if this layer doesn't need to be decoded for diffing
                if (((diffingFlag >> layerIndex) & 0x1) === 0)
                    continue;
                // reset readbits state
                this.bitIndex = 16;
                this.bitValue = 0;
                // tile skip counter
                var skipTileCounter = 0;
                for (var tileOffsetY = 0; tileOffsetY < 240; tileOffsetY += 128) {
                    for (var tileOffsetX = 0; tileOffsetX < 320; tileOffsetX += 128) {
                        // loop small tiles
                        for (var subTileOffsetY = 0; subTileOffsetY < 128; subTileOffsetY += 8) {
                            var y = tileOffsetY + subTileOffsetY;
                            if (y >= 240)
                                break;
                            for (var subTileOffsetX = 0; subTileOffsetX < 128; subTileOffsetX += 8) {
                                var x = tileOffsetX + subTileOffsetX;
                                if (x >= 320)
                                    break;
                                // continue to next tile loop if skipTileCounter is > 0
                                if (skipTileCounter > 0) {
                                    skipTileCounter -= 1;
                                    continue;
                                }
                                var pixelBufferPtr = y * KwzParser.width + x;
                                var tileType = this.readBits(3);
                                if (tileType === 0) {
                                    var linePtr = this.readBits(5) * 8;
                                    var pixels = KWZ_LINE_TABLE_COMMON.subarray(linePtr, linePtr + 8);
                                    pixelBuffer.set(pixels, pixelBufferPtr);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                }
                                else if (tileType === 1) {
                                    var linePtr = this.readBits(13) * 8;
                                    var pixels = KWZ_LINE_TABLE.subarray(linePtr, linePtr + 8);
                                    pixelBuffer.set(pixels, pixelBufferPtr);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                    pixelBuffer.set(pixels, pixelBufferPtr += 320);
                                }
                                else if (tileType === 2) {
                                    var linePtr = this.readBits(5) * 8;
                                    var a = KWZ_LINE_TABLE_COMMON.subarray(linePtr, linePtr + 8);
                                    var b = KWZ_LINE_TABLE_COMMON_SHIFT.subarray(linePtr, linePtr + 8);
                                    pixelBuffer.set(a, pixelBufferPtr);
                                    pixelBuffer.set(b, pixelBufferPtr += 320);
                                    pixelBuffer.set(a, pixelBufferPtr += 320);
                                    pixelBuffer.set(b, pixelBufferPtr += 320);
                                    pixelBuffer.set(a, pixelBufferPtr += 320);
                                    pixelBuffer.set(b, pixelBufferPtr += 320);
                                    pixelBuffer.set(a, pixelBufferPtr += 320);
                                    pixelBuffer.set(b, pixelBufferPtr += 320);
                                }
                                else if (tileType === 3) {
                                    var linePtr = this.readBits(13) * 8;
                                    var a = KWZ_LINE_TABLE.subarray(linePtr, linePtr + 8);
                                    var b = KWZ_LINE_TABLE_SHIFT.subarray(linePtr, linePtr + 8);
                                    pixelBuffer.set(a, pixelBufferPtr);
                                    pixelBuffer.set(b, pixelBufferPtr += 320);
                                    pixelBuffer.set(a, pixelBufferPtr += 320);
                                    pixelBuffer.set(b, pixelBufferPtr += 320);
                                    pixelBuffer.set(a, pixelBufferPtr += 320);
                                    pixelBuffer.set(b, pixelBufferPtr += 320);
                                    pixelBuffer.set(a, pixelBufferPtr += 320);
                                    pixelBuffer.set(b, pixelBufferPtr += 320);
                                }
                                // most common tile type
                                else if (tileType === 4) {
                                    var flags = this.readBits(8);
                                    for (var mask = 1; mask < 0xFF; mask <<= 1) {
                                        if (flags & mask) {
                                            var linePtr = this.readBits(5) * 8;
                                            var pixels = KWZ_LINE_TABLE_COMMON.subarray(linePtr, linePtr + 8);
                                            pixelBuffer.set(pixels, pixelBufferPtr);
                                        }
                                        else {
                                            var linePtr = this.readBits(13) * 8;
                                            var pixels = KWZ_LINE_TABLE.subarray(linePtr, linePtr + 8);
                                            pixelBuffer.set(pixels, pixelBufferPtr);
                                        }
                                        pixelBufferPtr += 320;
                                    }
                                }
                                else if (tileType === 5) {
                                    skipTileCounter = this.readBits(5);
                                    continue;
                                }
                                // type 6 doesnt exist
                                else if (tileType === 7) {
                                    var pattern = this.readBits(2);
                                    var useCommonLines = this.readBits(1);
                                    var a = void 0, b = void 0;
                                    if (useCommonLines !== 0) {
                                        var linePtrA = this.readBits(5) * 8;
                                        var linePtrB = this.readBits(5) * 8;
                                        a = KWZ_LINE_TABLE_COMMON.subarray(linePtrA, linePtrA + 8);
                                        b = KWZ_LINE_TABLE_COMMON.subarray(linePtrB, linePtrB + 8);
                                        pattern += 1;
                                    }
                                    else {
                                        var linePtrA = this.readBits(13) * 8;
                                        var linePtrB = this.readBits(13) * 8;
                                        a = KWZ_LINE_TABLE.subarray(linePtrA, linePtrA + 8);
                                        b = KWZ_LINE_TABLE.subarray(linePtrB, linePtrB + 8);
                                    }
                                    switch (pattern % 4) {
                                        case 0:
                                            pixelBuffer.set(a, pixelBufferPtr);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            break;
                                        case 1:
                                            pixelBuffer.set(a, pixelBufferPtr);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            break;
                                        case 2:
                                            pixelBuffer.set(a, pixelBufferPtr);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            break;
                                        case 3:
                                            pixelBuffer.set(a, pixelBufferPtr);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            pixelBuffer.set(a, pixelBufferPtr += 320);
                                            pixelBuffer.set(b, pixelBufferPtr += 320);
                                            break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            this.prevFrameIndex = frameIndex;
            return this.layers;
        };
        /**
         * Get the pixels for a given frame layer
         * @category Image
        */
        KwzParser.prototype.getLayerPixels = function (frameIndex, layerIndex) {
            if (this.prevFrameIndex !== frameIndex)
                this.decodeFrame(frameIndex);
            // layer buffer
            var layers = this.layers[layerIndex];
            // palette
            var palette = this.getFramePaletteIndices(frameIndex);
            var paletteOffs = layerIndex * 2 + 1;
            // image dimensions and crop
            var width = this.imageWidth;
            var height = this.imageHeight;
            var xOffs = this.imageOffsetX;
            var yOffs = this.imageOffsetY;
            var image = new Uint8Array(width * height);
            // pixel loop
            for (var srcY = yOffs, dstY = 0; dstY < height; srcY++, dstY++) {
                for (var srcX = xOffs, dstX = 0; dstX < width; srcX++, dstX++) {
                    var srcPtr = srcY * KwzParser.width + srcX;
                    var dstPtr = dstY * width + dstX;
                    var pixel = layers[srcPtr];
                    if (pixel === 1)
                        image[dstPtr] = palette[paletteOffs];
                    else if (pixel === 2)
                        image[dstPtr] = palette[paletteOffs + 1];
                }
            }
            return image;
        };
        /**
         * Get the pixels for a given frame
         * @category Image
        */
        KwzParser.prototype.getFramePixels = function (frameIndex) {
            if (this.prevFrameIndex !== frameIndex)
                this.decodeFrame(frameIndex);
            var layerOrder = this.getFrameLayerOrder(frameIndex);
            // layer buffers
            var layerA = this.layers[layerOrder[2]]; // top
            var layerB = this.layers[layerOrder[1]]; // middle
            var layerC = this.layers[layerOrder[0]]; // bottom
            // palette
            var palette = this.getFramePaletteIndices(frameIndex);
            // layer palette offsets
            var layerAPalleteOffs = layerOrder[2] * 2;
            var layerBPalleteOffs = layerOrder[1] * 2;
            var layerCPalleteOffs = layerOrder[0] * 2;
            // image dimensions and crop
            var width = this.imageWidth;
            var height = this.imageHeight;
            var xOffs = this.imageOffsetX;
            var yOffs = this.imageOffsetY;
            var image = new Uint8Array(width * height);
            image.fill(palette[0]);
            // pixel loop
            for (var srcY = yOffs, dstY = 0; dstY < height; srcY++, dstY++) {
                for (var srcX = xOffs, dstX = 0; dstX < width; srcX++, dstX++) {
                    var srcPtr = srcY * KwzParser.width + srcX;
                    var dstPtr = dstY * width + dstX;
                    var a = layerA[srcPtr];
                    var b = layerB[srcPtr];
                    var c = layerC[srcPtr];
                    if (a !== 0)
                        image[dstPtr] = palette[layerAPalleteOffs + a];
                    else if (b !== 0)
                        image[dstPtr] = palette[layerBPalleteOffs + b];
                    else if (c !== 0)
                        image[dstPtr] = palette[layerCPalleteOffs + c];
                }
            }
            return image;
        };
        /**
         * Get the sound effect flags for every frame in the Flipnote
         * @category Audio
        */
        KwzParser.prototype.decodeSoundFlags = function () {
            var result = [];
            for (var i = 0; i < this.frameCount; i++) {
                result.push(this.getFrameSoundFlags(i));
            }
            return result;
        };
        /**
         * Get the raw compressed audio data for a given track
         * @returns Byte array
         * @category Audio
        */
        KwzParser.prototype.getAudioTrackRaw = function (trackId) {
            var trackMeta = this.soundMeta.get(trackId);
            assert(trackMeta.ptr + trackMeta.length < this.byteLength);
            return new Uint8Array(this.buffer, trackMeta.ptr, trackMeta.length);
        };
        /**
         * Get the decoded audio data for a given track, using the track's native samplerate
         * @returns Signed 16-bit PCM audio
         * @category Audio
        */
        KwzParser.prototype.decodeAudioTrack = function (trackId) {
            var adpcm = this.getAudioTrackRaw(trackId);
            var output = new Int16Array(16364 * 60);
            var outputPtr = 0;
            // initial decoder state
            // Flipnote 3D's initial values are actually buggy, so corrections are applied by default here
            var predictor = 0;
            var stepIndex = 0;
            var sample = 0;
            var step = 0;
            var diff = 0;
            // DSi Library notes, however, seem to only work with 40 (at least the correctly converted ones)
            // users of the library may also wish to enable the original audio setup for console accuracy
            if (this.settings.originalAudio || this.isDsiLibraryNote)
                stepIndex = 40;
            // loop through each byte in the raw adpcm data
            for (var adpcmPtr = 0; adpcmPtr < adpcm.length; adpcmPtr++) {
                var currByte = adpcm[adpcmPtr];
                var currBit = 0;
                while (currBit < 8) {
                    // 2 bit sample
                    if (stepIndex < 18 || currBit > 4) {
                        sample = currByte & 0x3;
                        step = ADPCM_STEP_TABLE[stepIndex];
                        diff = step >> 3;
                        if (sample & 1)
                            diff += step;
                        if (sample & 2)
                            diff = -diff;
                        predictor += diff;
                        stepIndex += ADPCM_INDEX_TABLE_2BIT[sample];
                        currByte >>= 2;
                        currBit += 2;
                    }
                    // 4 bit sample
                    else {
                        sample = currByte & 0xf;
                        step = ADPCM_STEP_TABLE[stepIndex];
                        diff = step >> 3;
                        if (sample & 1)
                            diff += step >> 2;
                        if (sample & 2)
                            diff += step >> 1;
                        if (sample & 4)
                            diff += step;
                        if (sample & 8)
                            diff = -diff;
                        predictor += diff;
                        stepIndex += ADPCM_INDEX_TABLE_4BIT[sample];
                        currByte >>= 4;
                        currBit += 4;
                    }
                    stepIndex = clamp(stepIndex, 0, 79);
                    // clamp as 12 bit then scale to 16
                    predictor = clamp(predictor, -2048, 2047);
                    output[outputPtr] = predictor * 16;
                    outputPtr += 1;
                }
            }
            return output.slice(0, outputPtr);
        };
        /**
         * Get the decoded audio data for a given track, using the specified samplerate
         * @returns Signed 16-bit PCM audio
         * @category Audio
        */
        KwzParser.prototype.getAudioTrackPcm = function (trackId, dstFreq) {
            if (dstFreq === void 0) { dstFreq = this.sampleRate; }
            var srcPcm = this.decodeAudioTrack(trackId);
            var srcFreq = this.rawSampleRate;
            if (trackId === exports.FlipnoteAudioTrack.BGM) {
                var bgmAdjust = (1 / this.bgmrate) / (1 / this.framerate);
                srcFreq = this.rawSampleRate * bgmAdjust;
            }
            if (srcFreq !== dstFreq)
                return pcmResampleLinear(srcPcm, srcFreq, dstFreq);
            return srcPcm;
        };
        KwzParser.prototype.pcmAudioMix = function (src, dst, dstOffset) {
            if (dstOffset === void 0) { dstOffset = 0; }
            var srcSize = src.length;
            var dstSize = dst.length;
            for (var n = 0; n < srcSize; n++) {
                if (dstOffset + n > dstSize)
                    break;
                // half src volume
                var samp = dst[dstOffset + n] + src[n];
                dst[dstOffset + n] = clamp(samp, -32768, 32767);
            }
        };
        /**
         * Get the full mixed audio for the Flipnote, using the specified samplerate
         * @returns Signed 16-bit PCM audio
         * @category Audio
        */
        KwzParser.prototype.getAudioMasterPcm = function (dstFreq) {
            if (dstFreq === void 0) { dstFreq = this.sampleRate; }
            var dstSize = Math.ceil(this.duration * dstFreq);
            var master = new Int16Array(dstSize);
            var hasBgm = this.hasAudioTrack(exports.FlipnoteAudioTrack.BGM);
            var hasSe1 = this.hasAudioTrack(exports.FlipnoteAudioTrack.SE1);
            var hasSe2 = this.hasAudioTrack(exports.FlipnoteAudioTrack.SE2);
            var hasSe3 = this.hasAudioTrack(exports.FlipnoteAudioTrack.SE3);
            var hasSe4 = this.hasAudioTrack(exports.FlipnoteAudioTrack.SE4);
            // Mix background music
            if (hasBgm) {
                var bgmPcm = this.getAudioTrackPcm(exports.FlipnoteAudioTrack.BGM, dstFreq);
                this.pcmAudioMix(bgmPcm, master, 0);
            }
            // Mix sound effects
            if (hasSe1 || hasSe2 || hasSe3 || hasSe4) {
                var samplesPerFrame = dstFreq / this.framerate;
                var se1Pcm = hasSe1 ? this.getAudioTrackPcm(exports.FlipnoteAudioTrack.SE1, dstFreq) : null;
                var se2Pcm = hasSe2 ? this.getAudioTrackPcm(exports.FlipnoteAudioTrack.SE2, dstFreq) : null;
                var se3Pcm = hasSe3 ? this.getAudioTrackPcm(exports.FlipnoteAudioTrack.SE3, dstFreq) : null;
                var se4Pcm = hasSe4 ? this.getAudioTrackPcm(exports.FlipnoteAudioTrack.SE4, dstFreq) : null;
                for (var i = 0; i < this.frameCount; i++) {
                    var seFlags = this.getFrameSoundFlags(i);
                    var seOffset = Math.ceil(i * samplesPerFrame);
                    if (hasSe1 && seFlags[0])
                        this.pcmAudioMix(se1Pcm, master, seOffset);
                    if (hasSe2 && seFlags[1])
                        this.pcmAudioMix(se2Pcm, master, seOffset);
                    if (hasSe3 && seFlags[2])
                        this.pcmAudioMix(se3Pcm, master, seOffset);
                    if (hasSe4 && seFlags[3])
                        this.pcmAudioMix(se4Pcm, master, seOffset);
                }
            }
            this.audioClipRatio = pcmGetClippingRatio(master);
            return master;
        };
        /** Default KWZ parser settings */
        KwzParser.defaultSettings = {
            quickMeta: false,
            dsiLibraryNote: false,
            borderCrop: false,
            originalAudio: false
        };
        /** File format type */
        KwzParser.format = exports.FlipnoteFormat.KWZ;
        /** Animation frame width */
        KwzParser.width = 320;
        /** Animation frame height */
        KwzParser.height = 240;
        /** Number of animation frame layers */
        KwzParser.numLayers = 3;
        /** Audio track base sample rate */
        KwzParser.rawSampleRate = 16364;
        /** Audio output sample rate. NOTE: probably isn't accurate, full KWZ audio stack is still on the todo */
        KwzParser.sampleRate = 32768;
        /** Global animation frame color palette */
        KwzParser.globalPalette = [
            KWZ_PALETTE.WHITE,
            KWZ_PALETTE.BLACK,
            KWZ_PALETTE.RED,
            KWZ_PALETTE.YELLOW,
            KWZ_PALETTE.GREEN,
            KWZ_PALETTE.BLUE,
            KWZ_PALETTE.NONE,
        ];
        return KwzParser;
    }(FlipnoteParser));

    /**
     * Loader for web url strings (Browser only)
     * @internal
     */
    var webUrlLoader = {
        matches: function (source) {
            return isBrowser && typeof source === 'string';
        },
        load: function (source, resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', source, true);
            xhr.responseType = 'arraybuffer';
            xhr.onreadystatechange = function (e) {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300)
                        resolve(xhr.response);
                    else
                        reject({
                            type: 'httpError',
                            status: xhr.status,
                            statusText: xhr.statusText
                        });
                }
            };
            xhr.send(null);
        }
    };

    /**
     * Loader for web url strings (Node only)
     * @internal
     */
    var nodeUrlLoader = {
        matches: function (source) {
            return isNode && typeof source === 'string';
        },
        load: function (source, resolve, reject) {
            var http = require('https');
            http.get(source, function (res) {
                var chunks = [];
                res.on('data', function (chunk) { return chunks.push(chunk); });
                res.on('end', function () {
                    var buffer = Buffer.concat(chunks);
                    resolve(buffer.buffer);
                });
                res.on('error', function (err) { return reject(err); });
            });
        }
    };

    /**
     * Loader for File objects (browser only)
     * @internal
     */
    var fileLoader = {
        matches: function (source) {
            return isBrowser && typeof File !== 'undefined' && source instanceof File;
        },
        load: function (source, resolve, reject) {
            assert(typeof FileReader !== 'undefined');
            var reader = new FileReader();
            reader.onload = function (event) {
                resolve(reader.result);
            };
            reader.onerror = function (event) {
                reject({ type: 'fileReadError' });
            };
            reader.readAsArrayBuffer(source);
        }
    };

    /**
     * Loader for Buffer objects (Node only)
     * @internal
     */
    var nodeBufferLoader = {
        matches: function (source) {
            return isNode && (source instanceof Buffer);
        },
        load: function (source, resolve, reject) {
            resolve(source.buffer);
        }
    };

    /**
     * Loader for ArrayBuffer objects
     * @internal
     */
    var arrayBufferLoader = {
        matches: function (source) {
            return (source instanceof ArrayBuffer);
        },
        load: function (source, resolve, reject) {
            resolve(source);
        }
    };

    /** @internal */
    var loaders = [
        webUrlLoader,
        nodeUrlLoader,
        fileLoader,
        nodeBufferLoader,
        arrayBufferLoader
    ];
    /** @internal */
    function loadSource(source) {
        return new Promise(function (resolve, reject) {
            for (var i = 0; i < loaders.length; i++) {
                var loader = loaders[i];
                if (loader.matches(source))
                    return loader.load(source, resolve, reject);
            }
            reject('No loader available for source type');
        });
    }

    /**
     * Load a Flipnote from a given source, returning a promise with a parser object.
     * It will auto-detect the Flipnote format and return either a {@link PpmParser} or {@link KwzParser} accordingly.
     *
     * @param source - Source to load a Flipnote from. Depending on the operating envionment, this can be:
     * - A string representing a web URL
     * - An {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer | ArrayBuffer}
     * - A {@link https://developer.mozilla.org/en-US/docs/Web/API/File | File} object (Browser only)
     * - A {@link https://nodejs.org/api/buffer.html | Buffer} object (NodeJS only)
     * @param parserConfig - Config settings to pass to the parser, see {@link FlipnoteParserSettings}
     */
    function parseSource(source, parserConfig) {
        return loadSource(source)
            .then(function (arrayBuffer) {
            return new Promise(function (resolve, reject) {
                // check the buffer's magic to identify which format it uses
                var magicBytes = new Uint8Array(arrayBuffer.slice(0, 4));
                var magic = (magicBytes[0] << 24) | (magicBytes[1] << 16) | (magicBytes[2] << 8) | magicBytes[3];
                // check if magic is PARA (ppm magic)
                if (magic === 0x50415241)
                    resolve(new PpmParser(arrayBuffer, parserConfig));
                // check if magic is KFH (kwz magic)
                else if ((magic & 0xFFFFFF00) === 0x4B464800)
                    resolve(new KwzParser(arrayBuffer, parserConfig));
                // check if magic is KIC (fs3d folder icon)
                else if ((magic & 0xFFFFFF00) === 0x4B494300)
                    resolve(new KwzParser(arrayBuffer, parserConfig));
                else
                    reject('Could not identify source as a valid Flipnote file');
            });
        });
    }

    /**
     * Player event types
     */
    (function (PlayerEvent) {
        PlayerEvent["__Any"] = "any";
        PlayerEvent["Play"] = "play";
        PlayerEvent["Pause"] = "pause";
        PlayerEvent["CanPlay"] = "canplay";
        PlayerEvent["CanPlayThrough"] = "canplaythrough";
        PlayerEvent["SeekStart"] = "seeking";
        PlayerEvent["SeekEnd"] = "seeked";
        PlayerEvent["Duration"] = "durationchange";
        PlayerEvent["Loop"] = "loop";
        PlayerEvent["Ended"] = "ended";
        PlayerEvent["VolumeChange"] = "volumechange";
        PlayerEvent["Progress"] = "progress";
        PlayerEvent["TimeUpdate"] = "timeupdate";
        PlayerEvent["FrameUpdate"] = "frameupdate";
        PlayerEvent["FrameNext"] = "framenext";
        PlayerEvent["FramePrev"] = "frameprev";
        PlayerEvent["FrameFirst"] = "framefirst";
        PlayerEvent["FrameLast"] = "framelast";
        PlayerEvent["Ready"] = "ready";
        PlayerEvent["Load"] = "load";
        PlayerEvent["LoadStart"] = "loadstart";
        PlayerEvent["LoadedData"] = "loadeddata";
        PlayerEvent["LoadedMeta"] = "loadedmetadata";
        PlayerEvent["Emptied"] = "emptied";
        PlayerEvent["Close"] = "close";
        PlayerEvent["Error"] = "error";
        PlayerEvent["Destroy"] = "destroy";
    })(exports.PlayerEvent || (exports.PlayerEvent = {}));
    /** @internal */
    var supportedEvents = [
        exports.PlayerEvent.Play,
        exports.PlayerEvent.Pause,
        exports.PlayerEvent.CanPlay,
        exports.PlayerEvent.CanPlayThrough,
        exports.PlayerEvent.SeekStart,
        exports.PlayerEvent.SeekEnd,
        exports.PlayerEvent.Duration,
        exports.PlayerEvent.Loop,
        exports.PlayerEvent.Ended,
        exports.PlayerEvent.VolumeChange,
        exports.PlayerEvent.Progress,
        exports.PlayerEvent.TimeUpdate,
        exports.PlayerEvent.FrameUpdate,
        exports.PlayerEvent.FrameNext,
        exports.PlayerEvent.FramePrev,
        exports.PlayerEvent.FrameFirst,
        exports.PlayerEvent.FrameLast,
        exports.PlayerEvent.Ready,
        exports.PlayerEvent.Load,
        exports.PlayerEvent.LoadStart,
        exports.PlayerEvent.LoadedData,
        exports.PlayerEvent.LoadedMeta,
        exports.PlayerEvent.Emptied,
        exports.PlayerEvent.Close,
        exports.PlayerEvent.Error,
    ];

    /* @license twgl.js 4.17.0 Copyright (c) 2015, Gregg Tavares All Rights Reserved.
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
    //  return parseFloat(gl.getParameter(gl."5.3.0").substr(6));
    //}

    /**
     * Check if context is WebGL 2.0
     * @param {WebGLRenderingContext} gl A WebGLRenderingContext
     * @return {bool} true if it's WebGL 2.0
     * @memberOf module:twgl
     */
    function isWebGL2(gl) {
      // This is the correct check but it's slow
      //  return gl.getParameter(gl."5.3.0").indexOf("WebGL 2.0") === 0;
      // This might also be the correct check but I'm assuming it's slow-ish
      // return gl instanceof WebGL2RenderingContext;
      return !!gl.texStorage2D;
    }

    const TEXTURE0                       = 0x84c0;

    const ARRAY_BUFFER$1                   = 0x8892;

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
        const isArray = uniformInfo.name.endsWith("[0]");
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
        if (name.endsWith("[0]")) {
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

    var layerDrawShader = "precision highp float;\n#define GLSLIFY 1\nvarying vec2 v_uv;uniform sampler2D u_palette;uniform sampler2D u_bitmap;uniform float u_paletteOffset;const vec4 transparent=vec4(0,0,0,0);void main(){float index=texture2D(u_bitmap,v_uv).a*255.;if(index>0.){gl_FragColor=texture2D(u_palette,vec2((u_paletteOffset+index)/8.,.5));}else{gl_FragColor=transparent;}}"; // eslint-disable-line

    var postProcessShader = "precision highp float;\n#define GLSLIFY 1\nvarying vec2 v_uv;uniform sampler2D u_tex;varying float v_scale;uniform vec2 u_textureSize;uniform vec2 u_screenSize;void main(){vec2 v_texel=v_uv*u_textureSize;vec2 texel_floored=floor(v_texel);vec2 s=fract(v_texel);float region_range=0.5-0.5/v_scale;vec2 center_dist=s-0.5;vec2 f=(center_dist-clamp(center_dist,-region_range,region_range))*v_scale+0.5;vec2 mod_texel=texel_floored+f;vec2 coord=mod_texel.xy/u_textureSize.xy;gl_FragColor=texture2D(u_tex,coord);}"; // eslint-disable-line

    /**
     * Animation frame renderer, built around the {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API WebGL} API
     *
     * Only available in browser contexts
     */
    var WebglRenderer = /** @class */ (function () {
        /**
         * Creates a new WebGlCanvas instance
         * @param el - Canvas HTML element to use as a rendering surface
         * @param width - Canvas width in CSS pixels
         * @param height - Canvas height in CSS pixels
         *
         * The ratio between `width` and `height` should be 3:4 for best results
         */
        function WebglRenderer(el, width, height, options) {
            var _this = this;
            if (width === void 0) { width = 640; }
            if (height === void 0) { height = 480; }
            if (options === void 0) { options = {}; }
            this.refs = {
                programs: [],
                shaders: [],
                textures: [],
                buffers: [],
                framebuffers: []
            };
            this.isCtxLost = false;
            this.handleContextLoss = function (e) {
                e.preventDefault();
                _this.destroy();
                _this.isCtxLost = true;
                _this.options.onlost();
            };
            this.handleContextRestored = function (e) {
                _this.isCtxLost = false;
                _this.init();
                _this.options.onrestored();
            };
            assertBrowserEnv();
            this.el = el;
            this.width = width;
            this.height = height;
            this.options = __assign(__assign({}, WebglRenderer.defaultOptions), options);
            el.addEventListener('webglcontextlost', this.handleContextLoss, false);
            el.addEventListener('webglcontextrestored', this.handleContextRestored, false);
            this.gl = el.getContext('webgl', {
                antialias: false,
                alpha: true
            });
            this.init();
        }
        WebglRenderer.prototype.init = function () {
            var gl = this.gl;
            this.layerDrawProgram = this.createProgram(quadShader, layerDrawShader);
            this.postProcessProgram = this.createProgram(quadShader, postProcessShader);
            this.quadBuffer = this.createScreenQuad(-1, -1, 2, 2, 8, 8);
            this.setBuffersAndAttribs(this.layerDrawProgram, this.quadBuffer);
            this.setBuffersAndAttribs(this.postProcessProgram, this.quadBuffer);
            this.paletteData = new Uint8Array(8 * 4);
            this.paletteTexture = this.createTexture(gl.RGBA, gl.NEAREST, gl.CLAMP_TO_EDGE, 8, 1);
            this.layerTexture = this.createTexture(gl.ALPHA, gl.NEAREST, gl.CLAMP_TO_EDGE);
            this.frameTexture = this.createTexture(gl.RGBA, gl.LINEAR, gl.CLAMP_TO_EDGE);
            this.frameBuffer = this.createFrameBuffer(this.frameTexture);
            this.setCanvasSize(this.width, this.height);
        };
        WebglRenderer.prototype.createProgram = function (vertexShaderSource, fragmentShaderSource) {
            assert(!this.isCtxLost);
            var gl = this.gl;
            var vert = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
            var frag = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
            var program = gl.createProgram();
            // set up shaders
            gl.attachShader(program, vert);
            gl.attachShader(program, frag);
            // link program
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                var log = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                throw new Error(log);
            }
            var programInfo = createProgramInfoFromProgram(gl, program);
            this.refs.programs.push(program);
            return programInfo;
        };
        WebglRenderer.prototype.createShader = function (type, source) {
            assert(!this.isCtxLost);
            var gl = this.gl;
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            // test if shader compilation was successful
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                var log = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                throw new Error(log);
            }
            this.refs.shaders.push(shader);
            return shader;
        };
        // creating a subdivided quad seems to produce slightly nicer texture filtering
        WebglRenderer.prototype.createScreenQuad = function (x0, y0, width, height, xSubdivs, ySubdivs) {
            assert(!this.isCtxLost);
            var numVerts = (xSubdivs + 1) * (ySubdivs + 1);
            var numVertsAcross = xSubdivs + 1;
            var positions = new Float32Array(numVerts * 2);
            var texCoords = new Float32Array(numVerts * 2);
            var positionPtr = 0;
            var texCoordPtr = 0;
            for (var y = 0; y <= ySubdivs; y++) {
                for (var x = 0; x <= xSubdivs; x++) {
                    var u = x / xSubdivs;
                    var v = y / ySubdivs;
                    positions[positionPtr++] = x0 + width * u;
                    positions[positionPtr++] = y0 + height * v;
                    texCoords[texCoordPtr++] = u;
                    texCoords[texCoordPtr++] = v;
                }
            }
            var indices = new Uint16Array(xSubdivs * ySubdivs * 2 * 3);
            var indicesPtr = 0;
            for (var y = 0; y < ySubdivs; y++) {
                for (var x = 0; x < xSubdivs; x++) {
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
            var bufferInfo = createBufferInfoFromArrays(this.gl, {
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
            // collect references to buffer objects
            for (var name_1 in bufferInfo.attribs)
                this.refs.buffers.push(bufferInfo.attribs[name_1].buffer);
            return bufferInfo;
        };
        WebglRenderer.prototype.setBuffersAndAttribs = function (program, buffer) {
            var gl = this.gl;
            setAttributes(program.attribSetters, buffer.attribs);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);
        };
        WebglRenderer.prototype.createTexture = function (type, minMag, wrap, width, height) {
            if (width === void 0) { width = 1; }
            if (height === void 0) { height = 1; }
            assert(!this.isCtxLost);
            var gl = this.gl;
            var tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minMag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, minMag);
            gl.texImage2D(gl.TEXTURE_2D, 0, type, width, height, 0, type, gl.UNSIGNED_BYTE, null);
            this.refs.textures.push(tex);
            return tex;
        };
        WebglRenderer.prototype.createFrameBuffer = function (colorTexture) {
            assert(!this.isCtxLost);
            var gl = this.gl;
            var fb = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            // enable alpha blending
            gl.enable(gl.BLEND);
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            // bind a texture to the framebuffer
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
            this.refs.framebuffers.push(fb);
            return fb;
        };
        /**
         * Resize the canvas surface
         * @param width - New canvas width, in CSS pixels
         * @param height - New canvas height, in CSS pixels
         *
         * The ratio between `width` and `height` should be 3:4 for best results
         */
        WebglRenderer.prototype.setCanvasSize = function (width, height) {
            assert(!this.isCtxLost);
            var dpi = window.devicePixelRatio || 1;
            var internalWidth = width * dpi;
            var internalHeight = height * dpi;
            this.width = width;
            this.height = height;
            this.el.width = internalWidth;
            this.el.height = internalHeight;
            this.screenWidth = internalWidth;
            this.screenHeight = internalHeight;
            this.el.style.width = width + "px";
            this.el.style.height = height + "px";
        };
        /**
         * Sets the size of the input pixel arrays
         * @param width
         * @param height
         */
        WebglRenderer.prototype.setInputSize = function (width, height) {
            var gl = this.gl;
            this.textureWidth = width;
            this.textureHeight = height;
            // resize frame texture
            gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureWidth, this.textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        };
        /**
         * Clear frame buffer
         * @param colors - Paper color as `[R, G, B, A]`
         */
        WebglRenderer.prototype.clearFrameBuffer = function (paperColor) {
            assert(!this.isCtxLost);
            var gl = this.gl;
            // bind to the frame buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
            gl.viewport(0, 0, this.textureWidth, this.textureHeight);
            // clear it using the paper color
            var r = paperColor[0], g = paperColor[1], b = paperColor[2], a = paperColor[3];
            gl.clearColor(r / 255, g / 255, b / 255, a / 255);
            gl.clear(gl.COLOR_BUFFER_BIT);
        };
        /**
         * Set the color palette to use for the next {@link drawPixels} call
         * @param colors - Array of colors as `[R, G, B, A]`
         */
        WebglRenderer.prototype.setPalette = function (colors) {
            assert(!this.isCtxLost);
            assert(colors.length < 16);
            var gl = this.gl;
            var data = this.paletteData.fill(0);
            var dataPtr = 0;
            for (var i = 0; i < colors.length; i++) {
                var _a = colors[i], r = _a[0], g = _a[1], b = _a[2], a = _a[3];
                data[dataPtr++] = r;
                data[dataPtr++] = g;
                data[dataPtr++] = b;
                data[dataPtr++] = a;
            }
            // update layer texture pixels
            gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        };
        /**
         * Draw pixels to the frame buffer
         *
         * Note: use {@link composite} to draw the frame buffer to the canvas
         * @param pixels - Array of color indices for every pixl
         * @param paletteOffset - Palette offset index for the pixels being drawn
         */
        WebglRenderer.prototype.drawPixels = function (pixels, paletteOffset) {
            var _a = this, gl = _a.gl, layerDrawProgram = _a.layerDrawProgram, layerTexture = _a.layerTexture, textureWidth = _a.textureWidth, textureHeight = _a.textureHeight;
            assert(!this.isCtxLost);
            assert(pixels.length === textureWidth * textureHeight);
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
        };
        /**
         * Composites the current frame buffer into the canvas, applying post-processing effects like scaling filters if enabled
         */
        WebglRenderer.prototype.composite = function () {
            var gl = this.gl;
            assert(!this.isCtxLost);
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
        };
        /**
         * Returns true if the webGL context has returned an error
         */
        WebglRenderer.prototype.isErrorState = function () {
            var gl = this.gl;
            var error = gl.getError();
            return error != gl.NO_ERROR && error != gl.CONTEXT_LOST_WEBGL;
        };
        /**
         * Only a certain number of WebGL contexts can be added to a single page before the browser will start culling old contexts.
         * This method returns true if it has been culled, false if not
         */
        WebglRenderer.prototype.isLost = function () {
            return this.gl.isContextLost();
        };
        /**
         * Frees any resources used by this canvas instance
         */
        WebglRenderer.prototype.destroy = function () {
            return __awaiter(this, void 0, void 0, function () {
                var refs, gl;
                return __generator(this, function (_a) {
                    refs = this.refs;
                    gl = this.gl;
                    refs.shaders.forEach(function (shader) {
                        gl.deleteShader(shader);
                    });
                    refs.shaders = [];
                    refs.framebuffers.forEach(function (fb) {
                        gl.deleteFramebuffer(fb);
                    });
                    refs.framebuffers = [];
                    refs.textures.forEach(function (texture) {
                        gl.deleteTexture(texture);
                    });
                    refs.textures = [];
                    refs.buffers.forEach(function (buffer) {
                        gl.deleteBuffer(buffer);
                    });
                    refs.buffers = [];
                    refs.programs.forEach(function (program) {
                        gl.deleteProgram(program);
                    });
                    refs.programs = [];
                    this.paletteData = null;
                    // shrink the canvas to reduce memory usage until it is garbage collected
                    gl.canvas.width = 1;
                    gl.canvas.height = 1;
                    return [2 /*return*/];
                });
            });
        };
        WebglRenderer.defaultOptions = {
            onlost: function () { },
            onrestored: function () { },
        };
        return WebglRenderer;
    }());

    /** @internal */
    var _AudioContext = (function () {
        if (isBrowser)
            return (window.AudioContext || window.webkitAudioContext);
        return null;
    })();
    /**
     * Audio player built around the {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API | Web Audio API}
     *
     * Capable of playing PCM streams, with volume adjustment and an optional equalizer. Only available in browser contexts
     */
    var WebAudioPlayer = /** @class */ (function () {
        function WebAudioPlayer() {
            /** Whether the audio is being run through an equalizer or not */
            this.useEq = false;
            /** Default equalizer settings. Credit to {@link https://www.sudomemo.net/ | Sudomemo} for these */
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
            this._loop = false;
            this.nodeRefs = [];
            assertBrowserEnv();
        }
        Object.defineProperty(WebAudioPlayer.prototype, "volume", {
            get: function () {
                return this._volume;
            },
            /** The audio output volume. Range is 0 to 1 */
            set: function (value) {
                this.setVolume(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(WebAudioPlayer.prototype, "loop", {
            get: function () {
                return this._loop;
            },
            /** Whether the audio should loop after it has ended */
            set: function (value) {
                this._loop = value;
                if (this.source)
                    this.source.loop = value;
            },
            enumerable: false,
            configurable: true
        });
        WebAudioPlayer.prototype.getCtx = function () {
            if (!this.ctx)
                this.ctx = new _AudioContext();
            return this.ctx;
        };
        /**
         * Set the audio buffer to play
         * @param inputBuffer
         * @param sampleRate - For best results, this should be a multiple of 16364
         */
        WebAudioPlayer.prototype.setBuffer = function (inputBuffer, sampleRate) {
            var ctx = this.getCtx();
            var numSamples = inputBuffer.length;
            var audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
            var channelData = audioBuffer.getChannelData(0);
            if (inputBuffer instanceof Float32Array)
                channelData.set(inputBuffer, 0);
            else if (inputBuffer instanceof Int16Array) {
                for (var i = 0; i < numSamples; i++) {
                    channelData[i] = inputBuffer[i] / 32768;
                }
            }
            this.buffer = audioBuffer;
            this.sampleRate = sampleRate;
        };
        WebAudioPlayer.prototype.connectEqNodesTo = function (inNode) {
            var _this = this;
            var ctx = this.getCtx();
            var eqSettings = this.eqSettings;
            var lastNode = inNode;
            eqSettings.forEach(function (_a, index) {
                var frequency = _a[0], gain = _a[1];
                var node = ctx.createBiquadFilter();
                _this.nodeRefs.push(node);
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
        };
        WebAudioPlayer.prototype.initNodes = function () {
            var ctx = this.getCtx();
            this.nodeRefs = [];
            var source = ctx.createBufferSource();
            this.nodeRefs.push(source);
            source.buffer = this.buffer;
            var gainNode = ctx.createGain();
            this.nodeRefs.push(gainNode);
            if (this.useEq) {
                var eq = this.connectEqNodesTo(source);
                eq.connect(gainNode);
            }
            else
                source.connect(gainNode);
            source.connect(gainNode);
            gainNode.connect(ctx.destination);
            this.source = source;
            this.gainNode = gainNode;
            this.setVolume(this._volume);
        };
        /**
         * Sets the audio volume level
         * @param value - range is 0 to 1
         */
        WebAudioPlayer.prototype.setVolume = function (value) {
            this._volume = value;
            if (this.gainNode) {
                // human perception of loudness is logarithmic, rather than linear
                // https://www.dr-lex.be/info-stuff/volumecontrols.html
                this.gainNode.gain.value = Math.pow(value, 2);
            }
        };
        /**
         * Begin playback from a specific point
         *
         * Note that the WebAudioPlayer doesn't keep track of audio playback itself. We rely on the {@link Player} API for that.
         * @param currentTime initial playback position, in seconds
         */
        WebAudioPlayer.prototype.playFrom = function (currentTime) {
            this.initNodes();
            this.source.loop = this._loop;
            this.source.start(0, currentTime);
        };
        /**
         * Stops the audio playback
         */
        WebAudioPlayer.prototype.stop = function () {
            if (this.source)
                this.source.stop(0);
        };
        /**
       * Frees any resources used by this canvas instance
       */
        WebAudioPlayer.prototype.destroy = function () {
            return __awaiter(this, void 0, void 0, function () {
                var ctx;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.stop();
                            ctx = this.getCtx();
                            this.nodeRefs.forEach(function (node) { return node.disconnect(); });
                            this.nodeRefs = [];
                            if (!(ctx.state !== 'closed' && typeof ctx.close === 'function')) return [3 /*break*/, 2];
                            return [4 /*yield*/, ctx.close()];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            this.buffer = null;
                            return [2 /*return*/];
                    }
                });
            });
        };
        return WebAudioPlayer;
    }());

    /** @internal */
    function createTimeRanges(ranges) {
        return {
            length: ranges.length,
            start: function (i) { return ranges[i][0]; },
            end: function (i) { return ranges[i][1]; },
        };
    }
    /** @internal */
    function padNumber(num, strLength) {
        return num.toString().padStart(strLength, '0');
    }
    /** @internal */
    function formatTime(seconds) {
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor(seconds % 60);
        return m + ":" + padNumber(s, 2);
    }

    /**
     * Flipnote Player API (exported as `flipnote.Player`) - provides a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement | MediaElement}-like interface for loading Flipnotes and playing them.
     * This is intended for cases where you want to implement your own player UI, if you just want a pre-built player with some nice UI controls, check out the {@page Web Components} page instead!
     *
     * ### Create a new player
     *
     * You'll need a canvas element in your page's HTML:
     *
     * ```html
     *  <canvas id="player-canvas"></canvas>
     * ```
     *
     * Then you can create a new `Player` instance by passing a CSS selector that matches the canvas, plus the disired width and height.
     *
     * ```js
     *  const player = new flipnote.Player('#player-canvas', 320, 240);
     * ```
     *
     * ### Load a Flipnote
     *
     * Load a Flipnote from a valid {@link FlipnoteSource}:
     *
     * ```js
     * player.load('./path/to/flipnote.ppm');
     * ```
     *
     * ### Listen to events
     *
     * Use the {@link on} method to register event listeners:
     *
     * ```js
     *  player.on('play', function() {
     *    // do something when the Flipnote starts playing...
     *  });
     * ```
     */
    var Player = /** @class */ (function () {
        /**
         * Create a new Player instance
         *
         * @param el - Canvas element (or CSS selector matching a canvas element) to use as a rendering surface
         * @param width - Canvas width (pixels)
         * @param height - Canvas height (pixels)
         *
         * The ratio between `width` and `height` should be 3:4 for best results
         */
        function Player(el, width, height) {
            var _this = this;
            /** Animation duration, in seconds */
            this.duration = 0;
            /** Automatically begin playback after a Flipnote is loaded */
            this.autoplay = false;
            /** Array of events supported by this player */
            this.supportedEvents = supportedEvents;
            /** @internal */
            this._src = null;
            /** @internal */
            this._loop = false;
            /** @internal */
            this._volume = 1;
            /** @internal */
            this._muted = false;
            /** @internal */
            this._frame = null;
            /** @internal */
            this.isNoteLoaded = false;
            /** @internal */
            this.events = new Map();
            /** @internal */
            this.playbackStartTime = 0;
            /** @internal */
            this.playbackTime = 0;
            /** @internal */
            this.playbackLoopId = null;
            /** @internal */
            this.showThumbnail = true;
            /** @internal */
            this.hasPlaybackStarted = false;
            /** @internal */
            this.isPlaying = false;
            /** @internal */
            this.wasPlaying = false;
            /** @internal */
            this.isSeeking = false;
            /**
             * Playback animation loop
             * @internal
             * @category Playback Control
             */
            this.playbackLoop = function (timestamp) {
                if (!_this.isPlaying)
                    return;
                var now = timestamp / 1000;
                var currPlaybackTime = now - _this.playbackStartTime;
                if (currPlaybackTime >= _this.duration) {
                    if (_this.loop) {
                        _this.playbackStartTime = now;
                        _this.emit(exports.PlayerEvent.Loop);
                    }
                    else {
                        _this.pause();
                        _this.emit(exports.PlayerEvent.Ended);
                    }
                }
                _this.setCurrentTime(currPlaybackTime % _this.duration);
                _this.playbackLoopId = requestAnimationFrame(_this.playbackLoop);
            };
            assertBrowserEnv();
            // if `el` is a string, use it to select an Element, else assume it's an element
            el = ('string' == typeof el) ? document.querySelector(el) : el;
            this.renderer = new WebglRenderer(el, width, height, {
                onlost: function () { return _this.emit(exports.PlayerEvent.Error); },
                onrestored: function () { return _this.load(); }
            });
            this.audio = new WebAudioPlayer();
            this.canvasEl = this.renderer.el;
        }
        Object.defineProperty(Player.prototype, "src", {
            /** The currently loaded Flipnote source, if there is one. Can be overridden to load another Flipnote */
            get: function () {
                return this._src;
            },
            set: function (source) {
                this.load(source);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "paused", {
            /** Indicates whether playback is currently paused */
            get: function () {
                return !this.isPlaying;
            },
            set: function (isPaused) {
                if (isPaused)
                    this.pause();
                else
                    this.play();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "currentFrame", {
            /** Current animation frame index */
            get: function () {
                return this._frame;
            },
            set: function (frameIndex) {
                this.setCurrentFrame(frameIndex);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "currentTime", {
            /** Current animation playback position, in seconds */
            get: function () {
                return this.isNoteLoaded ? this.playbackTime : null;
            },
            set: function (value) {
                this.setCurrentTime(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "progress", {
            /** Current animation playback progress, as a percentage out of 100 */
            get: function () {
                return this.isNoteLoaded ? (this.playbackTime / this.duration) * 100 : null;
            },
            set: function (value) {
                this.setProgress(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "volume", {
            /** Audio volume, range `0` to `1` */
            get: function () {
                return this.getVolume();
            },
            set: function (value) {
                this.setVolume(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "muted", {
            /** Audio mute state */
            get: function () {
                return this.getMuted();
            },
            set: function (value) {
                this.setMuted(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "loop", {
            /** Indicates whether playback should loop once the end is reached */
            get: function () {
                return this.getLoop();
            },
            set: function (value) {
                this.setLoop(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "framerate", {
            /** Animation frame rate, measured in frames per second */
            get: function () {
                return this.note.framerate;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "frameCount", {
            /** Animation frame count */
            get: function () {
                return this.note.frameCount;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "frameSpeed", {
            /** Animation frame speed */
            get: function () {
                return this.note.frameSpeed;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "buffered", {
            /**
             * Implementation of the `HTMLMediaElement` {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/buffered | buffered } property
             * @category HTMLVideoElement compatibility
             */
            get: function () {
                return createTimeRanges([[0, this.duration]]);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "seekable", {
            /**
             * Implementation of the `HTMLMediaElement` {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seekable | seekable} property
             * @category HTMLVideoElement compatibility
             */
            get: function () {
                return createTimeRanges([[0, this.duration]]);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "currentSrc", {
            /**
             * Implementation of the `HTMLMediaElement` {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentSrc | currentSrc} property
             * @category HTMLVideoElement compatibility
             */
            get: function () {
                return this._src;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "videoWidth", {
            /**
             * Implementation of the `HTMLVideoElement` {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/videoWidth | videoWidth} property
             * @category HTMLVideoElement compatibility
             */
            get: function () {
                return this.isNoteLoaded ? this.note.imageWidth : 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "videoHeight", {
            /**
             * Implementation of the `HTMLVideoElement` {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/videoHeight | videoHeight} property
             * @category HTMLVideoElement compatibility
             */
            get: function () {
                return this.isNoteLoaded ? this.note.imageHeight : 0;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Open a Flipnote from a source
         * @category Lifecycle
         */
        Player.prototype.load = function (source) {
            if (source === void 0) { source = null; }
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    // close currently open note first
                    if (this.isNoteLoaded)
                        this.closeNote();
                    // if no source specified, just reset everything
                    if (!source)
                        return [2 /*return*/, this.openNote(this.note)];
                    // otherwise do a normal load
                    this.emit(exports.PlayerEvent.LoadStart);
                    return [2 /*return*/, parseSource(source)
                            .then(function (note) {
                            _this.openNote(note);
                            _this._src = source;
                        })
                            .catch(function (err) {
                            _this.emit(exports.PlayerEvent.Error, err);
                            throw new Error("Error loading Flipnote: " + err.message);
                        })];
                });
            });
        };
        /**
         * Close the currently loaded Flipnote
         * @category Lifecycle
         */
        Player.prototype.closeNote = function () {
            this.pause();
            this.note = null;
            this.isNoteLoaded = false;
            this.meta = null;
            this._src = null;
            this._frame = 0;
            // this.playbackFrame = null;
            this.playbackTime = 0;
            this.duration = 0;
            this.loop = false;
            this.isPlaying = false;
            this.wasPlaying = false;
            this.hasPlaybackStarted = false;
            this.showThumbnail = true;
            this.renderer.clearFrameBuffer([0, 0, 0, 0]);
        };
        /**
         * Open a Flipnote into the player
         * @category Lifecycle
         */
        Player.prototype.openNote = function (note) {
            if (this.isNoteLoaded)
                this.closeNote();
            this.note = note;
            this.meta = note.meta;
            this.emit(exports.PlayerEvent.LoadedMeta);
            this.noteFormat = note.format;
            this.duration = note.duration;
            this.playbackTime = 0;
            this._frame = 0;
            this.isNoteLoaded = true;
            this.isPlaying = false;
            this.wasPlaying = false;
            this.hasPlaybackStarted = false;
            this.layerVisibility = note.layerVisibility;
            this.showThumbnail = true;
            this.audio.setBuffer(note.getAudioMasterPcm(), note.sampleRate);
            this.emit(exports.PlayerEvent.CanPlay);
            this.emit(exports.PlayerEvent.CanPlayThrough);
            this.setLoop(note.meta.loop);
            this.renderer.setInputSize(note.imageWidth, note.imageHeight);
            this.drawFrame(note.thumbFrameIndex);
            this.emit(exports.PlayerEvent.LoadedData);
            this.emit(exports.PlayerEvent.Load);
            this.emit(exports.PlayerEvent.Ready);
            if (this.autoplay)
                this.play();
        };
        /**
         * Set the current playback time
         * @category Playback Control
         */
        Player.prototype.setCurrentTime = function (value) {
            this.assertNoteLoaded();
            var i = Math.floor(value / (1 / this.framerate));
            this.setCurrentFrame(i);
            this.playbackTime = value;
            this.emit(exports.PlayerEvent.Progress, this.progress);
        };
        /**
         * Get the current playback time
         * @category Playback Control
         */
        Player.prototype.getCurrentTime = function () {
            return this.currentTime;
        };
        /**
         * Get the current time as a counter string, like `"0:00 / 1:00"`
         * @category Playback Control
         */
        Player.prototype.getTimeCounter = function () {
            var currentTime = formatTime(Math.max(this.currentTime, 0));
            var duration = formatTime(this.duration);
            return currentTime + " / " + duration;
        };
        /**
         * Get the current frame index as a counter string, like `"001 / 999"`
         * @category Playback Control
         */
        Player.prototype.getFrameCounter = function () {
            var frame = padNumber(this.currentFrame + 1, 3);
            var total = padNumber(this.frameCount, 3);
            return frame + " / " + total;
        };
        /**
         * Set the current playback progress as a percentage (`0` to `100`)
         * @category Playback Control
         */
        Player.prototype.setProgress = function (value) {
            this.assertNoteLoaded();
            assertRange(value, 0, 100, 'progress');
            this.currentTime = this.duration * (value / 100);
        };
        /**
         * Get the current playback progress as a percentage (0 to 100)
         * @category Playback Control
         */
        Player.prototype.getProgress = function () {
            return this.progress;
        };
        /**
         * Begin animation playback starting at the current position
         * @category Playback Control
         */
        Player.prototype.play = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now;
                return __generator(this, function (_a) {
                    this.assertNoteLoaded();
                    if (this.isPlaying)
                        return [2 /*return*/];
                    // if ((!this.hasPlaybackStarted) || ((!this.loop) && (this.currentFrame == this.frameCount - 1)))
                    //   this.playbackTime = 0;
                    this.isPlaying = true;
                    this.hasPlaybackStarted = true;
                    now = performance.now();
                    this.playbackStartTime = (now / 1000) - this.playbackTime;
                    this.playAudio();
                    this.playbackLoop(now);
                    this.emit(exports.PlayerEvent.Play);
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Pause animation playback at the current position
         * @category Playback Control
         */
        Player.prototype.pause = function () {
            if (!this.isPlaying)
                return;
            this.isPlaying = false;
            if (this.playbackLoopId !== null)
                cancelAnimationFrame(this.playbackLoopId);
            this.stopAudio();
            this.emit(exports.PlayerEvent.Pause);
        };
        /**
         * Resumes animation playback if paused, otherwise pauses
         * @category Playback Control
         */
        Player.prototype.togglePlay = function () {
            if (!this.isPlaying)
                this.play();
            else
                this.pause();
        };
        /**
         * Determines if playback is currently paused
         * @category Playback Control
         */
        Player.prototype.getPaused = function () {
            return !this.isPlaying;
        };
        /**
         * Get the duration of the Flipnote in seconds
         * @category Playback Control
         */
        Player.prototype.getDuration = function () {
            return this.duration;
        };
        /**
         * Determines if playback is looped
         * @category Playback Control
         */
        Player.prototype.getLoop = function () {
            return this._loop;
        };
        /**
         * Set the playback loop
         * @category Playback Control
         */
        Player.prototype.setLoop = function (loop) {
            this._loop = loop;
            this.audio.loop = loop;
        };
        /**
         * Switch the playback loop between on and off
         * @category Playback Control
         */
        Player.prototype.toggleLoop = function () {
            this.setLoop(!this._loop);
        };
        /**
         * Jump to a given animation frame
         * @category Frame Control
         */
        Player.prototype.setCurrentFrame = function (newFrameValue) {
            this.assertNoteLoaded();
            var newFrameIndex = Math.max(0, Math.min(Math.floor(newFrameValue), this.frameCount - 1));
            if (newFrameIndex === this.currentFrame && !this.showThumbnail)
                return;
            this._frame = newFrameIndex;
            this.drawFrame(newFrameIndex);
            this.showThumbnail = false;
            if (!this.isPlaying) {
                this.playbackTime = newFrameIndex * (1 / this.framerate);
                this.emit(exports.PlayerEvent.SeekEnd);
            }
            this.emit(exports.PlayerEvent.FrameUpdate, this.currentFrame);
            this.emit(exports.PlayerEvent.Progress, this.progress);
            this.emit(exports.PlayerEvent.TimeUpdate, this.currentFrame);
        };
        /**
         * Jump to the next animation frame
         * If the animation loops, and is currently on its last frame, it will wrap to the first frame
         * @category Frame Control
         */
        Player.prototype.nextFrame = function () {
            if ((this.loop) && (this.currentFrame === this.frameCount - 1))
                this.currentFrame = 0;
            else
                this.currentFrame += 1;
            this.emit(exports.PlayerEvent.FrameNext);
        };
        /**
         * Jump to the next animation frame
         * If the animation loops, and is currently on its first frame, it will wrap to the last frame
         * @category Frame Control
         */
        Player.prototype.prevFrame = function () {
            if ((this.loop) && (this.currentFrame === 0))
                this.currentFrame = this.frameCount - 1;
            else
                this.currentFrame -= 1;
            this.emit(exports.PlayerEvent.FramePrev);
        };
        /**
         * Jump to the last animation frame
         * @category Frame Control
         */
        Player.prototype.lastFrame = function () {
            this.currentFrame = this.frameCount - 1;
            this.emit(exports.PlayerEvent.FrameLast);
        };
        /**
         * Jump to the first animation frame
         * @category Frame Control
         */
        Player.prototype.firstFrame = function () {
            this.currentFrame = 0;
            this.emit(exports.PlayerEvent.FrameFirst);
        };
        /**
         * Jump to the thumbnail frame
         * @category Frame Control
         */
        Player.prototype.thumbnailFrame = function () {
            this.currentFrame = this.note.thumbFrameIndex;
        };
        /**
         * Begins a seek operation
         * @category Playback Control
         */
        Player.prototype.startSeek = function () {
            if (!this.isSeeking) {
                this.emit(exports.PlayerEvent.SeekStart);
                this.wasPlaying = this.isPlaying;
                this.pause();
                this.isSeeking = true;
            }
        };
        /**
         * Seek the playback progress to a different position
         * @param position - animation playback position, range `0` to `1`
         * @category Playback Control
         */
        Player.prototype.seek = function (position) {
            if (this.isSeeking)
                this.progress = position * 100;
        };
        /**
         * Ends a seek operation
         * @category Playback Control
         */
        Player.prototype.endSeek = function () {
            if (this.isSeeking && this.wasPlaying === true)
                this.play();
            this.wasPlaying = false;
            this.isSeeking = false;
        };
        /**
         * Draws the specified animation frame to the canvas. Note that this doesn't update the playback time or anything, it simply decodes a given frame and displays it.
         * @param frameIndex
         * @category Display Control
         */
        Player.prototype.drawFrame = function (frameIndex) {
            var note = this.note;
            var canvas = this.renderer;
            var colors = note.getFramePalette(frameIndex);
            var layerBuffers = note.decodeFrame(frameIndex);
            var layerVisibility = this.layerVisibility;
            // this.canvas.setPaperColor(colors[0]);
            canvas.setPalette(colors);
            canvas.clearFrameBuffer(colors[0]);
            if (note.format === exports.FlipnoteFormat.PPM) {
                if (layerVisibility[2]) // bottom
                    canvas.drawPixels(layerBuffers[1], 1);
                if (layerVisibility[1]) // top
                    canvas.drawPixels(layerBuffers[0], 0);
            }
            else if (note.format === exports.FlipnoteFormat.KWZ) {
                var order = note.getFrameLayerOrder(frameIndex);
                var layerIndexC = order[0];
                var layerIndexB = order[1];
                var layerIndexA = order[2];
                if (layerVisibility[layerIndexC + 1]) // bottom
                    canvas.drawPixels(layerBuffers[layerIndexC], layerIndexC * 2);
                if (layerVisibility[layerIndexB + 1]) // middle
                    canvas.drawPixels(layerBuffers[layerIndexB], layerIndexB * 2);
                if (layerVisibility[layerIndexA + 1]) // top
                    canvas.drawPixels(layerBuffers[layerIndexA], layerIndexA * 2);
            }
            canvas.composite();
        };
        /**
         * Forces the current animation frame to be redrawn
         * @category Display Control
         */
        Player.prototype.forceUpdate = function () {
            if (this.isNoteLoaded)
                this.drawFrame(this.currentFrame);
        };
        /**
         * Resize the playback canvas to a new size
         * @param width - new canvas width (pixels)
         * @param height - new canvas height (pixels)
         *
         * The ratio between `width` and `height` should be 3:4 for best results
         *
         * @category Display Control
         */
        Player.prototype.resize = function (width, height) {
            if (height !== width * .75)
                console.warn("Canvas width to height ratio should be 3:4 for best results (got " + width + "x" + height + ")");
            this.renderer.setCanvasSize(width, height);
            this.forceUpdate();
        };
        /**
         * Sets whether an animation layer should be visible throughout the entire animation
         * @param layer - layer index, starting at 1
         * @param value - `true` for visible, `false` for invisible
         *
         * @category Display Control
         */
        Player.prototype.setLayerVisibility = function (layer, value) {
            this.layerVisibility[layer] = value;
            this.forceUpdate();
        };
        /**
         * Returns the visibility state for a given layer
         * @param layer - layer index, starting at 1
         *
         * @category Display Control
         */
        Player.prototype.getLayerVisibility = function (layer) {
            return this.layerVisibility[layer];
        };
        /**
         * Toggles whether an animation layer should be visible throughout the entire animation
         *
         * @category Display Control
         */
        Player.prototype.toggleLayerVisibility = function (layerIndex) {
            this.setLayerVisibility(layerIndex, !this.layerVisibility[layerIndex]);
        };
        Player.prototype.playAudio = function () {
            this.audio.playFrom(this.currentTime);
        };
        Player.prototype.stopAudio = function () {
            this.audio.stop();
        };
        /**
         * Toggle audio Sudomemo equalizer filter
         * @category Audio Control
         */
        Player.prototype.toggleAudioEq = function () {
            this.setAudioEq(!this.audio.useEq);
        };
        /**
         * Turn audio Sudomemo equalizer filter on or off
         * @category Audio Control
         */
        Player.prototype.setAudioEq = function (state) {
            if (this.isPlaying) {
                this.wasPlaying = true;
                this.stopAudio();
            }
            this.audio.useEq = state;
            if (this.wasPlaying) {
                this.wasPlaying = false;
                this.playAudio();
            }
        };
        /**
         * Turn the audio off
         * @category Audio Control
         */
        Player.prototype.mute = function () {
            this.setMuted(true);
        };
        /**
         * Turn the audio on
         * @category Audio Control
         */
        Player.prototype.unmute = function () {
            this.setMuted(false);
        };
        /**
         * Turn the audio on or off
         * @category Audio Control
         */
        Player.prototype.setMuted = function (isMute) {
            if (isMute)
                this.audio.volume = 0;
            else
                this.audio.volume = this._volume;
            this._muted = isMute;
            this.emit(exports.PlayerEvent.VolumeChange, this.audio.volume);
        };
        /**
         * Get the audio mute state
         * @category Audio Control
         */
        Player.prototype.getMuted = function () {
            return this.volume === 0 ? true : this._muted;
        };
        /**
         * Switch the audio between muted and unmuted
         * @category Audio Control
         */
        Player.prototype.toggleMuted = function () {
            this.setMuted(!this._muted);
        };
        /**
         * Set the audio volume
         * @category Audio Control
         */
        Player.prototype.setVolume = function (volume) {
            assertRange(volume, 0, 1, 'volume');
            this._volume = volume;
            this.audio.volume = volume;
            this.emit(exports.PlayerEvent.VolumeChange, this.audio.volume);
        };
        /**
         * Get the current audio volume
         * @category Audio Control
         */
        Player.prototype.getVolume = function () {
            return this._muted ? 0 : this._volume;
        };
        /**
         * Implementation of the `HTMLVideoElement` {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/seekToNextFrame | seekToNextFrame} method
         * @category HTMLVideoElement compatibility
         */
        Player.prototype.seekToNextFrame = function () {
            this.nextFrame();
        };
        /**
         * Implementation of the `HTMLMediaElement` {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/fastSeek | fastSeek} method
         * @category HTMLVideoElement compatibility
         */
        Player.prototype.fastSeek = function (time) {
            this.currentTime = time;
        };
        /**
         * Implementation of the `HTMLVideoElement` {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/getVideoPlaybackQuality | getVideoPlaybackQuality } method
         * @category HTMLVideoElement compatibility
         */
        Player.prototype.canPlayType = function (mediaType) {
            switch (mediaType) {
                case 'application/x-ppm':
                case 'application/x-kwz':
                case 'video/x-ppm':
                case 'video/x-kwz':
                // lauren is planning on registering these officially
                case 'video/vnd.nintendo.ugomemo.ppm':
                case 'video/vnd.nintendo.ugomemo.kwz':
                    return 'probably';
                case 'application/octet-stream':
                    return 'maybe';
                // and koizumi is planning his revenge
                case 'video/vnd.nintendo.ugomemo.fykt':
                default:
                    return '';
            }
        };
        /**
         * Implementation of the `HTMLVideoElement` [https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/getVideoPlaybackQuality](getVideoPlaybackQuality) method
         * @category HTMLVideoElement compatibility
         */
        Player.prototype.getVideoPlaybackQuality = function () {
            var quality = {
                creationTime: 0,
                droppedVideoFrames: 0,
                totalVideoFrames: this.frameCount
            };
            return quality;
        };
        /**
         * Implementation of the `HTMLVideoElement` [https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestPictureInPicture](requestPictureInPicture) method. Not currently working, only a stub.
         * @category HTMLVideoElement compatibility
         */
        Player.prototype.requestPictureInPicture = function () {
            throw new Error('Not implemented');
        };
        /**
         * Implementation of the `HTMLVideoElement` [https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/captureStream](captureStream) method. Not currently working, only a stub.
         * @category HTMLVideoElement compatibility
         */
        Player.prototype.captureStream = function () {
            throw new Error('Not implemented');
        };
        /**
         * Add an event callback
         * @category Event API
         */
        Player.prototype.on = function (eventType, listener) {
            var events = this.events;
            var eventList = Array.isArray(eventType) ? eventType : [eventType];
            eventList.forEach(function (eventType) {
                if (!events.has(eventType))
                    events.set(eventType, [listener]);
                else
                    events.get(eventType).push(listener);
            });
        };
        /**
         * Remove an event callback
         * @category Event API
         */
        Player.prototype.off = function (eventType, callback) {
            var events = this.events;
            var eventList = Array.isArray(eventType) ? eventType : [eventType];
            eventList.forEach(function (eventType) {
                if (!events.has(eventType))
                    return;
                var callbackList = events.get(eventType);
                events.set(eventType, callbackList.splice(callbackList.indexOf(callback), 1));
            });
        };
        /**
         * Emit an event - mostly used internally
         * @category Event API
         */
        Player.prototype.emit = function (eventType) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var events = this.events;
            if (eventType !== exports.PlayerEvent.__Any && events.has(eventType)) {
                var callbackList = events.get(eventType);
                callbackList.forEach(function (callback) { return callback.apply(null, args); });
                // call onwhatever() function for this event, if one has been added
                var listenerName = "on" + eventType;
                var thisAsAny = this;
                if (typeof thisAsAny[listenerName] === 'function')
                    thisAsAny[listenerName].apply(null, args);
            }
            // "any" event listeners fire for all events, and receive eventType as their first param
            if (events.has(exports.PlayerEvent.__Any)) {
                var callbackList = events.get(exports.PlayerEvent.__Any);
                callbackList.forEach(function (callback) { return callback.apply(null, __spreadArrays([eventType], args)); });
            }
        };
        /**
         * Remove all registered event callbacks
         * @category Event API
         */
        Player.prototype.clearEvents = function () {
            this.events.clear();
        };
        /**
         * Destroy a Player instace
         * @category Lifecycle
         */
        Player.prototype.destroy = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.clearEvents();
                            this.emit(exports.PlayerEvent.Destroy);
                            this.closeNote();
                            return [4 /*yield*/, this.renderer.destroy()];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.audio.destroy()];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Returns true if the player supports a given event or method name
         */
        Player.prototype.supports = function (name) {
            var isEvent = this.supportedEvents.includes(name);
            var isMethod = typeof this[name] === 'function';
            return isEvent || isMethod;
        };
        /** @internal */
        Player.prototype.assertNoteLoaded = function () {
            assert(this.isNoteLoaded, 'No Flipnote is currently loaded in this player');
        };
        return Player;
    }());

    /**
     * This is a bit of a hack to get a player component class to wrap a Player instance,
     * while also inheriting all of the Player API's methods and properties.
     *
     * The resulting PlayerMixinClass will get a Player instance on this.player,
     * and all of the Player API methods and properties applied as wrappers.
     *
     * e.g.
     * - PlayerMixinClass.play() will have the same behaviour as Player.play(), but will call this.player.play() internally.
     * - PlayerMixinClass.paused will have getters and setters to match it to this.player.paused.
     * @internal
     */
    function PlayerMixin(Target) {
        var PlayerMixinClass = /** @class */ (function (_super) {
            __extends(PlayerMixinClass, _super);
            function PlayerMixinClass() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Object.defineProperty(PlayerMixinClass.prototype, "renderer", {
                // Mixin needs to re-define all the normal player properties, but most should be made readonly anyway...
                get: function () {
                    return this.player.renderer;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(PlayerMixinClass.prototype, "audio", {
                get: function () {
                    return this.player.audio;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(PlayerMixinClass.prototype, "canvasEl", {
                get: function () {
                    return this.player.canvasEl;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(PlayerMixinClass.prototype, "note", {
                get: function () {
                    return this.player.note;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(PlayerMixinClass.prototype, "noteFormat", {
                get: function () {
                    return this.player.noteFormat;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(PlayerMixinClass.prototype, "meta", {
                get: function () {
                    return this.player.meta;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(PlayerMixinClass.prototype, "duration", {
                get: function () {
                    return this.player.duration;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(PlayerMixinClass.prototype, "layerVisibility", {
                get: function () {
                    return this.player.layerVisibility;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(PlayerMixinClass.prototype, "autoplay", {
                get: function () {
                    return this.player.autoplay;
                },
                set: function (value) {
                    this.player.autoplay = value;
                },
                enumerable: false,
                configurable: true
            });
            return PlayerMixinClass;
        }(Target));
        var _loop_1 = function (key) {
            var desc = Object.getOwnPropertyDescriptor(Player.prototype, key);
            // don't override stuff that already exists, and ignore JS prototype junk
            if (key in Target.prototype || key === 'constructor' || key === 'name' || key === 'prototype') {
                return "continue";
            }
            // override methods to call e.g. `this.player.methodName()` when `methodName()` is called
            else if (desc.value && typeof desc.value === 'function') {
                Object.defineProperty(PlayerMixinClass.prototype, key, __assign(__assign({}, desc), { value: function () {
                        var _a;
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        return (_a = this.player)[key].apply(_a, args);
                    } }));
            }
            // override getters and setters so that e.g. `property` will always reflect `this.player.property`
            else if (desc.get || desc.set) {
                Object.defineProperty(PlayerMixinClass.prototype, key, __assign(__assign({}, desc), { set: function (value) {
                        this.player[key] = value;
                    }, get: function () {
                        return this.player[key];
                    } }));
            }
        };
        // add all Player API methods and getter/setter props to target
        for (var _i = 0, _a = Reflect.ownKeys(Player.prototype); _i < _a.length; _i++) {
            var key = _a[_i];
            _loop_1(key);
        }
        return PlayerMixinClass;
    }

    var EncoderBase = /** @class */ (function () {
        function EncoderBase() {
            this.dataUrl = null;
        }
        /**
         * Returns the file data as a NodeJS {@link https://nodejs.org/api/buffer.html | Buffer}
         *
         * Note: This method does not work outside of NodeJS environments
         */
        EncoderBase.prototype.getBuffer = function () {
            assertNodeEnv();
            return Buffer.from(this.getArrayBuffer());
        };
        /**
         * Returns the file data as a {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob | Blob}
         */
        EncoderBase.prototype.getBlob = function () {
            assertBrowserEnv();
            return new Blob([this.getArrayBuffer()], {
                type: this.mimeType
            });
        };
        /**
         * Returns the file data as an {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL | Object URL}
         *
         * Note: This method does not work outside of browser environments
         */
        EncoderBase.prototype.getUrl = function () {
            assertBrowserEnv();
            if (this.dataUrl)
                return this.dataUrl;
            return window.URL.createObjectURL(this.getBlob());
        };
        /**
         * Revokes this file's {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL | Object URL} if one has been created, use this when the url created with {@link getUrl} is no longer needed, to preserve memory.
         *
         * Note: This method does not work outside of browser environments
         */
        EncoderBase.prototype.revokeUrl = function () {
            assertBrowserEnv();
            if (this.dataUrl)
                window.URL.revokeObjectURL(this.dataUrl);
        };
        return EncoderBase;
    }());

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
    /** @internal */
    var EOF = -1;
    /** @internal */
    var BITS = 12;
    /** @internal */
    var HSIZE = 5003; // 80% occupancy
    /** @internal */
    var masks = [
        0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F,
        0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF,
        0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF
    ];
    /** @internal */
    var LzwCompressor = /** @class */ (function () {
        function LzwCompressor(width, height, colorDepth) {
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
            this.colorDepth = colorDepth;
            this.reset();
        }
        LzwCompressor.prototype.reset = function () {
            this.initCodeSize = Math.max(2, this.colorDepth);
            this.accum.fill(0);
            this.htab.fill(0);
            this.codetab.fill(0);
            this.cur_accum = 0;
            this.cur_bits = 0;
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
        };
        // Add a character to the end of the current packet, and if it is 254
        // characters, flush the packet to disk.
        LzwCompressor.prototype.char_out = function (c, outs) {
            this.accum[this.a_count++] = c;
            if (this.a_count >= 254)
                this.flush_char(outs);
        };
        // Clear out the hash table
        // table clear for block compress
        LzwCompressor.prototype.cl_block = function (outs) {
            this.cl_hash(HSIZE);
            this.free_ent = this.ClearCode + 2;
            this.clear_flg = true;
            this.output(this.ClearCode, outs);
        };
        // Reset code table
        LzwCompressor.prototype.cl_hash = function (hsize) {
            for (var i = 0; i < hsize; ++i)
                this.htab[i] = -1;
        };
        LzwCompressor.prototype.compress = function (init_bits, outs) {
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
                    if (i === 0) {
                        disp = 1;
                    }
                    do {
                        if ((i -= disp) < 0) {
                            i += hsize_reg;
                        }
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
        };
        LzwCompressor.prototype.encode = function (pixels, outs) {
            this.pixels = pixels;
            outs.writeByte(this.initCodeSize); // write 'initial code size' byte
            this.remaining = this.width * this.height; // reset navigation variables
            this.curPixel = 0;
            this.compress(this.initCodeSize + 1, outs); // compress and write the pixel data
            outs.writeByte(0); // write block terminator
        };
        // Flush the packet to disk, and reset the this.accumulator
        LzwCompressor.prototype.flush_char = function (outs) {
            if (this.a_count > 0) {
                outs.writeByte(this.a_count);
                outs.writeBytes(this.accum, 0, this.a_count);
                this.a_count = 0;
            }
        };
        LzwCompressor.prototype.get_maxcode = function (n_bits) {
            return (1 << n_bits) - 1;
        };
        // Return the next pixel from the image
        LzwCompressor.prototype.nextPixel = function () {
            if (this.remaining === 0)
                return EOF;
            --this.remaining;
            var pix = this.pixels[this.curPixel++];
            return pix & 0xff;
        };
        LzwCompressor.prototype.output = function (code, outs) {
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
        };
        return LzwCompressor;
    }());

    /**
     * GIF image encoder
     *
     * Supports static single-frame GIF export as well as animated GIF
     * @category File Encoder
     */
    var GifImage = /** @class */ (function (_super) {
        __extends(GifImage, _super);
        /**
         * Create a new GIF image object
         * @param width image width
         * @param height image height
         * @param settings whether the gif should loop, the delay between frames, etc. See {@link GifEncoderSettings}
         */
        function GifImage(width, height, settings) {
            if (settings === void 0) { settings = {}; }
            var _this = _super.call(this) || this;
            _this.mimeType = 'gif/image';
            /** Number of current GIF frames */
            _this.frameCount = 0;
            _this.width = width;
            _this.height = height;
            _this.data = new ByteArray();
            _this.settings = __assign(__assign({}, GifImage.defaultSettings), settings);
            _this.compressor = new LzwCompressor(width, height, settings.colorDepth);
            return _this;
        }
        /**
         * Create an animated GIF image from a Flipnote
         *
         * This will encode the entire animation, so depending on the number of frames it could take a while to return.
         * @param flipnote {@link Flipnote} object ({@link PpmParser} or {@link KwzParser} instance)
         * @param settings whether the gif should loop, the delay between frames, etc. See {@link GifEncoderSettings}
         */
        GifImage.fromFlipnote = function (flipnote, settings) {
            var _a;
            if (settings === void 0) { settings = {}; }
            var gif = new GifImage(flipnote.imageWidth, flipnote.imageHeight, __assign({ delay: 100 / flipnote.framerate, repeat: ((_a = flipnote.meta) === null || _a === void 0 ? void 0 : _a.loop) ? -1 : 0 }, settings));
            gif.palette = flipnote.globalPalette;
            for (var frameIndex = 0; frameIndex < flipnote.frameCount; frameIndex++)
                gif.writeFrame(flipnote.getFramePixels(frameIndex));
            return gif;
        };
        /**
         * Create an GIF image from a single Flipnote frame
         * @param flipnote
         * @param frameIndex animation frame index to encode
         * @param settings whether the gif should loop, the delay between frames, etc. See {@link GifEncoderSettings}
         */
        GifImage.fromFlipnoteFrame = function (flipnote, frameIndex, settings) {
            if (settings === void 0) { settings = {}; }
            var gif = new GifImage(flipnote.imageWidth, flipnote.imageHeight, __assign({ 
                // TODO: look at ideal delay and repeat settings for single frame GIF
                delay: 100 / flipnote.framerate, repeat: -1 }, settings));
            gif.palette = flipnote.globalPalette;
            gif.writeFrame(flipnote.getFramePixels(frameIndex));
            return gif;
        };
        /**
         * Add a frame to the GIF image
         * @param pixels Raw pixels to encode, must be an uncompressed 8bit array of palette indices with a size matching image width * image height
         */
        GifImage.prototype.writeFrame = function (pixels) {
            if (this.frameCount === 0)
                this.writeFirstFrame(pixels);
            else
                this.writeAdditionalFrame(pixels);
            this.frameCount += 1;
        };
        GifImage.prototype.writeFirstFrame = function (pixels) {
            var paletteSize = this.palette.length;
            // calc colorDepth
            for (var p = 1; 1 << p < paletteSize; p += 1)
                continue;
            this.settings.colorDepth = p;
            this.writeHeader();
            this.writeColorTable();
            this.writeNetscapeExt();
            this.writeFrameHeader();
            this.writePixels(pixels);
        };
        GifImage.prototype.writeAdditionalFrame = function (pixels) {
            this.writeFrameHeader();
            this.writePixels(pixels);
        };
        GifImage.prototype.writeHeader = function () {
            var header = new DataStream(new ArrayBuffer(13));
            header.writeChars('GIF89a');
            // Logical Screen Descriptor
            header.writeUint16(this.width);
            header.writeUint16(this.height);
            header.writeUint8(0x80 | // 1 : global color table flag = 1 (gct used)
                (this.settings.colorDepth - 1) // 6-8 : gct size
            );
            header.writeBytes([
                0x0,
                0x0
            ]);
            this.data.writeBytes(new Uint8Array(header.buffer));
        };
        GifImage.prototype.writeColorTable = function () {
            var palette = new Uint8Array(3 * Math.pow(2, this.settings.colorDepth));
            var ptr = 0;
            for (var index = 0; index < this.palette.length; index += 1) {
                var _a = this.palette[index], r = _a[0], g = _a[1], b = _a[2], a = _a[3];
                palette[ptr++] = r;
                palette[ptr++] = g;
                palette[ptr++] = b;
            }
            this.data.writeBytes(palette);
        };
        GifImage.prototype.writeNetscapeExt = function () {
            var netscapeExt = new DataStream(new ArrayBuffer(19));
            netscapeExt.writeBytes([
                0x21,
                0xFF,
                11,
            ]);
            netscapeExt.writeChars('NETSCAPE2.0');
            netscapeExt.writeUint8(3); // subblock size
            netscapeExt.writeUint8(1); // loop subblock id
            netscapeExt.writeUint16(this.settings.repeat); // loop flag
            this.data.writeBytes(new Uint8Array(netscapeExt.buffer));
        };
        GifImage.prototype.writeFrameHeader = function () {
            var fHeader = new DataStream(new ArrayBuffer(18));
            // graphics control ext block
            var transparentFlag = this.settings.transparentBg ? 0x1 : 0x0;
            fHeader.writeBytes([
                0x21,
                0xF9,
                0x4,
                0x0 | transparentFlag // bitflags
            ]);
            fHeader.writeUint16(this.settings.delay); // loop flag
            fHeader.writeBytes([
                0x0,
                0x0
            ]);
            // image desc block
            fHeader.writeUint8(0x2C);
            fHeader.writeUint16(0); // image left
            fHeader.writeUint16(0); // image top
            fHeader.writeUint16(this.width);
            fHeader.writeUint16(this.height);
            fHeader.writeUint8(0);
            this.data.writeBytes(new Uint8Array(fHeader.buffer));
        };
        GifImage.prototype.writePixels = function (pixels) {
            this.compressor.colorDepth = this.settings.colorDepth;
            this.compressor.reset();
            this.compressor.encode(pixels, this.data);
        };
        /**
         * Returns the GIF image data as an {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer | ArrayBuffer}
         */
        GifImage.prototype.getArrayBuffer = function () {
            return this.data.getBuffer();
        };
        /**
          * Returns the GIF image data as an {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image | Image} object
          *
          * Note: This method does not work outside of browser environments
          */
        GifImage.prototype.getImage = function () {
            assertBrowserEnv();
            var img = new Image(this.width, this.height);
            img.src = this.getUrl();
            return img;
        };
        /**
         * Default GIF encoder settings
         */
        GifImage.defaultSettings = {
            transparentBg: false,
            delay: 100,
            repeat: -1,
            colorDepth: 8
        };
        return GifImage;
    }(EncoderBase));

    /**
     * Wav audio object. Used to create a {@link https://en.wikipedia.org/wiki/WAV | WAV} file from a PCM audio stream or a {@link Flipnote} object.
     *
     * Currently only supports PCM s16_le audio encoding.
     *
     * @category File Encoder
     */
    var WavAudio = /** @class */ (function (_super) {
        __extends(WavAudio, _super);
        /**
         * Create a new WAV audio object
         * @param sampleRate audio samplerate
         * @param channels number of audio channels
         * @param bitsPerSample number of bits per sample
         */
        function WavAudio(sampleRate, channels, bitsPerSample) {
            if (channels === void 0) { channels = 1; }
            if (bitsPerSample === void 0) { bitsPerSample = 16; }
            var _this = _super.call(this) || this;
            _this.sampleRate = sampleRate;
            _this.channels = channels;
            _this.bitsPerSample = bitsPerSample;
            // Write WAV file header
            // Reference: http://www.topherlee.com/software/pcm-tut-wavformat.html
            var headerBuffer = new ArrayBuffer(44);
            var header = new DataStream(headerBuffer);
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
            header.writeUint16(_this.channels);
            // audio sample rate
            header.writeUint32(_this.sampleRate);
            // byterate = (sampleRate * bitsPerSample * channelCount) / 8
            header.writeUint32((_this.sampleRate * _this.bitsPerSample * _this.channels) / 8);
            // blockalign = (bitsPerSample * channels) / 8
            header.writeUint16((_this.bitsPerSample * _this.channels) / 8);
            // bits per sample
            header.writeUint16(_this.bitsPerSample);
            // 'data' section header
            header.writeChars('data');
            // data section length (set later)
            header.writeUint32(0);
            _this.header = header;
            _this.pcmData = null;
            return _this;
        }
        /**
         * Create a WAV audio file from a Flipnote's master audio track
         * @param flipnote
         * @param trackId
         */
        WavAudio.fromFlipnote = function (note) {
            var sampleRate = note.sampleRate;
            var wav = new WavAudio(sampleRate, 1, 16);
            var pcm = note.getAudioMasterPcm(sampleRate);
            wav.writeSamples(pcm);
            return wav;
        };
        /**
         * Create a WAV audio file from a given Flipnote audio track
         * @param flipnote
         * @param trackId
         */
        WavAudio.fromFlipnoteTrack = function (flipnote, trackId) {
            var sampleRate = flipnote.sampleRate;
            var wav = new WavAudio(sampleRate, 1, 16);
            var pcm = flipnote.getAudioTrackPcm(trackId, sampleRate);
            wav.writeSamples(pcm);
            return wav;
        };
        /**
         * Add PCM audio frames to the WAV
         * @param pcmData signed int16 PCM audio samples
         */
        WavAudio.prototype.writeSamples = function (pcmData) {
            var header = this.header;
            // fill in filesize
            header.seek(4);
            header.writeUint32(header.byteLength + pcmData.byteLength);
            // fill in data section length
            header.seek(40);
            header.writeUint32(pcmData.byteLength);
            this.pcmData = pcmData;
        };
        /**
         * Returns the WAV audio data as an {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer | ArrayBuffer}
         */
        WavAudio.prototype.getArrayBuffer = function () {
            var headerBytes = this.header.bytes;
            var pcmBytes = new Uint8Array(this.pcmData.buffer);
            var resultBytes = new Uint8Array(this.header.byteLength + this.pcmData.byteLength);
            resultBytes.set(headerBytes);
            resultBytes.set(pcmBytes, headerBytes.byteLength);
            return resultBytes.buffer;
        };
        return WavAudio;
    }(EncoderBase));

    // Entrypoint for web and node
    /**
     * flipnote.js library version (exported as `flipnote.version`). You can find the latest version on the project's [NPM](https://www.npmjs.com/package/flipnote.js) page.
     */
    var version = "5.3.0"; // replaced by @rollup/plugin-replace; see rollup.config.js

    exports.GifImage = GifImage;
    exports.KwzParser = KwzParser;
    exports.Player = Player;
    exports.PlayerMixin = PlayerMixin;
    exports.PpmParser = PpmParser;
    exports.WavAudio = WavAudio;
    exports.parseSource = parseSource;
    exports.utils = fsid;
    exports.version = version;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
