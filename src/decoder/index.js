import fileReader from "./fileReader";
import {decodeAdpcm} from "./adpcm";

const WIDTH = 256;
const HEIGHT = 192;

const BLACK = [14, 14, 14, 255];
const WHITE = [255, 255, 255, 255];
const BLUE = [10, 57, 255, 255];
const RED = [255, 42, 42, 255];

// internal framerate value -> FPS table
const FRAMERATES = {
    1: 0.5,
    2: 1,
    3: 2,
    4: 4,
    5: 6,
    6: 12,
    7: 20,
    8: 30,
};

// utility function to help account for padding when dealing with certain offsets
function getPadLen(i, pad=4) {
  if (i % pad != 0) return i + pad - (i % pad);
  return i;
};

export default class ppmDecoder extends fileReader {
  constructor(arrBuffer) {
    super(arrBuffer);
    this.seek(4);
    this._frameDataLength = this.readUint32();
    this._soundDataLength = this.readUint32();
    this.frameCount = Math.min(this.readUint16() + 1, 999);
    this.seek(4, 1);
    this.thumbFrameIndex = this.readUint16();
    // jump to the start of the animation data section
    this.seek(0x06A0);
    var offsetTableLength = Math.min(this.readUint16(), this.frameCount * 4);
    this.seek(6, 1);
    this._frameOffsets = new Uint32Array(offsetTableLength / 4).map(_ => {
      return 0x06A0 + 8 + offsetTableLength + this.readUint32();
    });
    this._decodeSoundHeader();
    // jump to the start of the sound data
    // create image buffers
     this._layers = [
      new Uint8Array(WIDTH * HEIGHT),
      new Uint8Array(WIDTH * HEIGHT)
    ];
    this._prevLayers = [
      new Uint8Array(WIDTH * HEIGHT),
      new Uint8Array(WIDTH * HEIGHT)
    ];
    this._prevFrameIndex = 0;
  }

  _decodeSoundHeader() {
    // frame data offset + frame data length + sound effect flags, rouded up to next multiple of 4
    var soundDataOffset = getPadLen(0x06A0 + this._frameDataLength + this.frameCount, 4);
    this.seek(soundDataOffset);
    var bgmLen = this.readUint32();
    var se1Len = this.readUint32();
    var se2Len = this.readUint32();
    var se3Len = this.readUint32();
    this.frameSpeed = 8 - this.readUint8();
    this.bgmSpeed = 8 - this.readUint8();
    var offset = soundDataOffset + 32;
    this.soundMeta = {
      "bgm": {offset: offset,           length: bgmLen},
      "se1": {offset: offset += bgmLen, length: se1Len},
      "se2": {offset: offset += se1Len, length: se2Len},
      "se3": {offset: offset += se2Len, length: se3Len},
    };
    this.framerate = FRAMERATES[this.frameSpeed];
    this.bgmFramerate = FRAMERATES[this.bgmSpeed];
  }

  _seekToFrame(index) {
    this.seek(this._frameOffsets[index]);
  }

  _seekToAudio(track) {
    this.seek(this.soundMeta[track].offset);
  }

  _readLineEncoding() {
    var unpacked = new Uint8Array(HEIGHT);
    for (let byteOffset = 0; byteOffset < 48; byteOffset ++) {
      var byte = this.readUint8();
      for (let bitOffset = 0; bitOffset < 8; bitOffset += 2) {
        unpacked[byteOffset * 4 + bitOffset / 2] = (byte >> bitOffset) & 0x03;
      }
    }
    return unpacked;
  }

  getFramePalette(index) {
    this._seekToFrame(index);
    var header = this.readUint8();
    var paperColor = header & 0x1;
    var pen = [
      null,
      paperColor == 1 ? BLACK : WHITE,
      RED,
      BLUE,
    ];
    return [
      paperColor == 1 ? WHITE : BLACK,
      pen[(header >> 1) & 0x3], // layer 1 color
      pen[(header >> 3) & 0x3], // layer 2 color
    ];
  }

  _isFrameNew(index) {
    this._seekToFrame(index);
    var header = this.readUint8();
    return (header >> 7) & 0x1;
  }

  _decodePrevFrames(index) {
    var backTrack = 0;
    var isNew = 0;
    while (!isNew) {
      backTrack += 1;
      isNew = this._isFrameNew(index - backTrack);
    }
    backTrack = index - backTrack;
    while (backTrack < index) {
      this.decodeFrame(backTrack, false);
      backTrack += 1;
    }
    // jump back to where we were
    this._seekToFrame(index);
    this.seek(1, 1);
  }

  decodeFrame(index, decodePrev=true) {
    this._seekToFrame(index);
    var header = this.readUint8();
    var isNewFrame = (header >> 7) & 0x1;
    var isTranslated = (header >> 5) & 0x3;

    if ((decodePrev) && (!isNewFrame) && (index !== this._prevFrameIndex + 1)) {
      this._decodePrevFrames(index);
    }

    var layerEncoding = [
      this._readLineEncoding(),
      this._readLineEncoding()
    ];
    // copy the current layer buffers to the previous ones
    this._prevLayers[0].set(this._layers[0]);
    this._prevLayers[1].set(this._layers[1]);
    this._prevFrameIndex = index;
    // reset current layer buffers
    this._layers[0].fill(0);
    this._layers[1].fill(0);
    // start decoding layer bitmaps
    for (let layer = 0; layer < 2; layer++) {
      var layerBitmap = this._layers[layer];
      for (let line = 0; line < HEIGHT; line++) {
        var chunkOffset = line * WIDTH;
        var lineType = layerEncoding[layer][line];
        switch(lineType) {
          // line type 0 = blank line, decode nothing
          case 0:
            break;
          // line types 1 + 2 = compressed bitmap line
          case 1:
          case 2:
            var lineHeader = this.readUint32(false);
            // line type 2 starts as an inverted line
            if (lineType == 2) layerBitmap.fill(1, chunkOffset, chunkOffset + WIDTH);
            // loop through each bit in the line header
            while (lineHeader & 0xFFFFFFFF) {
              // if the bit is set, this 8-pix wide chunk is stored
              // else we can just leave it blank and move on to the next chunk
              if (lineHeader & 0x80000000) {
                var chunk = this.readUint8();
                // unpack chunk bits
                for (let pixel = 0; pixel < 8; pixel++) {
                  layerBitmap[chunkOffset + pixel] = chunk >> pixel & 0x1;
                }
              }
              chunkOffset += 8;
              lineHeader <<= 1;
            }
            break;
          // line type 3 = raw bitmap line
          case 3:
            while(chunkOffset < (line + 1) * WIDTH) {
              var chunk = this.readUint8();
              for (let pixel = 0; pixel < 8; pixel++) {
                layerBitmap[chunkOffset + pixel] = chunk >> pixel & 0x1;
              }
              chunkOffset += 8;
            }
            break;
        }
      }
    }
    if (isTranslated) {
      // TODO: handle prev frame translation
    }
    if (!isNewFrame) {
      let i = 0;
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          // if the current frame is based on changes from the preivous one, merge them by XORing their values
          this._layers[0][i] = this._layers[0][i] ^ this._prevLayers[0][i];
          this._layers[1][i] = this._layers[1][i] ^ this._prevLayers[1][i];
          i++;
        }
      }
    }
    return this._layers;
  }

  decodeAudio(track) {
    this._seekToAudio(track);
    var buffer = new Uint8Array(this.soundMeta[track].length).map(val => {
      return this.readUint8();
    });
    return decodeAdpcm(buffer);
  }

}