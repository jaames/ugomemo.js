// Entrypoint for web and node

export * from './FlipnoteTypes';

export {
  FlipnoteFormat,
  FlipnoteVersion,
  FlipnoteRegion,
  FlipnoteMeta,
  FlipnoteAudioTrack,
  FlipnoteAudioTrackInfo,
  FlipnotePaletteDefinition,
  FlipnoteLayerVisibility,
  KwzParser,
  PpmParser,
  KwzParserSettings,
  PpmParserSettings,
} from './parsers';

export { 
  parseSource
} from './parseSource';

export {
  Player
} from './player';

export {
  GifImage,
  WavAudio,
  // bitmap encoder is deprecated in favor of gif
  // BitmapEncoder
} from './encoders';

/** 
 * flipnote.js library version (exported as `flipnote.version`). You can find the latest version on the project's [NPM](https://www.npmjs.com/package/flipnote.js) page.
 */
export const version = VERSION; // replaced by @rollup/plugin-replace; see rollup.config.js
