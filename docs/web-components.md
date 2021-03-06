The web component build of Flipnote.js provides a set of custom HTML tags that can be used to easily embed a [Flipnote player UI (`<flipnote-player>`)](#flipnote-player) or [Flipnote image (`<flipnote-image>`)](#flipnote-image) in any webpage. 

# Installation

Installing the web component build is very similar to the usual installation steps listed on the {@page Getting Started} page, except we import a different file that has the additional web component code included.

## From a CDN (web)

```html
<script src="https://cdn.jsdelivr.net/npm/flipnote.js@5/dist/flipnote.webcomponent.min.js"></script>
```

## Self-host (web)

[**Development version**](https://raw.githubusercontent.com/jaames/flipnote.js/master/dist/flipnote.webcomponent.js)<br/>

[**Production version**](https://raw.githubusercontent.com/jaames/flipnote.js/master/dist/flipnote.webcomponent.min.js)<br/>

## From NPM (web via a bundler)

```js
// with the require() function:
const flipnote = require('flipnote.js/dist/flipnote.webcomponent.js');
// or with the es6 import syntax:
import flipnote from 'flipnote.js/dist/flipnote.webcomponent.js';
```

# flipnote-player

The `<flipnote-player>` element behaves almost exactly like the standard HTML5 [`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) element, except it can play any valid Flipnote Studio .ppm or .kwz animation file directly in the browser. It also provides a cute playback UI, inspired by my [web-based Flipnote Player](http://flipnote.rakujira.jp/).

Here's what it looks like:

<div>
<flipnote-player src="../../assets/notes/memoA.kwz"></flipnote-player>
</div>

## Basic usage

After inserting the script into your page, all you need to do is put a `<flipnote-player>` tag somewhere in your HTML, and give it a `src` attribute pointing to the URL of a Flipnote Studio .ppm or .kwz file:

```html
<flipnote-player src="./path/to/some/flipnote.kwz"></flipnote-player>
```

And... that's it!

## Attributes

#### `src`

The `src` attribute tells the player what Flipnote it should load, and it should point to the URL of a Flipnote Studio .ppm or .kwz animation file. This attribute be changed at any time to load another Flipnote into the same player.

The player can also load Flipnotes from other kinds of sources, such as from JavaScript [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) or [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) objects. For more information on this, check out the [JavaScript API](#javascript-api) section.

#### `controls`

The `controls` attribute can select between a couple of different UI control layouts.

Default:

```html
<flipnote-player src="./path/to/some/flipnote.ppm"></flipnote-player>
```

<div>
<flipnote-player src="../../assets/notes/juntso.ppm"></flipnote-player>
</div>

`compact`:

```html
<flipnote-player controls="compact" src="./path/to/some/flipnote.ppm"></flipnote-player>
```

<div>
<flipnote-player controls="compact" src="../../assets/notes/mrjohn.ppm"></flipnote-player>
</div>

## Styling

Some [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) can also be used to style various elements of the player UI. You can override any these variables to provide your own styles to the component via CSS, like so:

```css
flipnote-player {
  --flipnote-player-font-family: 'Helvetica';
  --flipnote-player-button-background: red;
}
```

### Available CSS variables

| CSS variable | Default value | Use |
|:-|:-|:-|
| `--flipnote-player-font-family` | `sans-serif` | Font to use for any player UI text |
| `--flipnote-player-controls-background` | `none` | Background color for the controls area |
| `--flipnote-player-button-background` | `#FFD3A6` | Background color for any player buttons |
| `--flipnote-player-button-color` | `#F36A2D` | Text and icon color for any player buttons |

This isn't super fleshed-out, so if you need more styling options for your use-case feel free to [open an issue](https://github.com/jaames/flipnote.js/issues) to request something!

## JavaScript API

The webcomponent implements nearly all of the {@link Player} API functionality, which can be useful for controling the player via JavaScript. To access this, first we need to give the player element a unique identifier that can be targeted from JavaScript, like an `id` attribute:

```html
<flipnote-player id="player" src="./path/to/some/flipnote.kwz"></flipnote-player>
```

Then in JavaScript, we can target the player:

```js
var player = document.getElementById('player');
```

There's a lot of functionality exposed here, so here's some of the highlights:

### Load and unload Flipnotes

```js
var player = document.getElementById('player');

// Load a Flipnote from a URL
player.load('./path/to/some/other/flipnote.ppm');
// Unloads the current Flipnote
player.close();
```

### Playback control

```js
var player = document.getElementById('player');

// Begin animation playback
player.play();
// Pause animation playback
player.pause();
// Pause if the animation is playing, else play
player.togglePlay();

// Jump to the next animation frame
player.nextFrame();
// Jump to the previous animation frame
player.prevFrame();
// Jump to frame 100
player.setFrame(100);
```

### Audio control

```js
var player = document.getElementById('player');

// Set volume to 100%
player.setVolume(1);
// Unmute audio
player.setMuted(false);
// Enable audio qualizer (uses the same EQ settings as Sudomemo)
player.setAudioEq(true);
```

## Events

The player element also fires regular DOM [events](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events) to signal when various actions have happened. 

As mentioned in the [JavaScript API](#javascript-api) section, first we need to add a unique identifier to our player element:

```html
<flipnote-player id="player" src="./path/to/some/flipnote.kwz"></flipnote-player>
```

And then in JavaScript, we can use the standard DOM event listener API to capture player events:

```js
var player = document.getElementById('player');
player.addEventListener('play', function() {
  // do something when playback starts
});
```

A full list of available events can be found on the {@link Player} API page.

## Limitations

The player uses [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) to render the Flipnote's animation frames, the benefits of which includes faster performance and lower power consumption compared to the HTML5 canvas API. However, one downside of this approach is that browsers have a hidden limit of how many WebGL contexts can appear on a single page. The number varies, but it's typically around 8 to 12. 

If this limit is reached, it will cull old rendering contexts before new ones are created, each player uses its own WebGL context, so this means you can only have a limited number of active player elements on a single page. Flipnote.js currently handles this by making the player show an error message if its context has been culled, but that isn't very good UX. In the future, I intend to automatically fall back to a HTML5 canvas renderer when this happens, although I haven't got around to implementing that yet. So please make a note of this.

# flipnote-image

The `<flipnote-image>` element behaves similarly to the standard HTML [`<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) element, except it can display a frame from any valid Flipnote Studio .ppm or .kwz animation file directly in the browser. It's a lot less taxing on resources than the player element, so you can use it to embed lots of Flipnote frames in the same page if you want.

<div>
<flipnote-image src="../../assets/notes/memoA.kwz"></flipnote-image>
</div>

It also works for Flipnote Gallery World comment files (.kwc)

<div>
<flipnote-image src="../../assets/notes/comment.kwc"></flipnote-image>
</div>

And even Flipnote Studio 3D's folder icons (!.ico)

<div>
<flipnote-image src="../../assets/notes/1.ico"></flipnote-image>
<flipnote-image src="../../assets/notes/2.ico"></flipnote-image>
<flipnote-image src="../../assets/notes/3.ico"></flipnote-image>
</div>

## Basic usage

After inserting the script into your page, all you need to do is put a `<flipnote-image>` tag somewhere in your HTML, and give it a `src` attribute pointing to the URL of a Flipnote Studio .ppm or .kwz file:

```html
<flipnote-image src="./path/to/some/flipnote.kwz"></flipnote-image>
```

## Attributes

#### `src`

The `src` attribute tells the image element what Flipnote it should load, and it should point to the URL of a Flipnote Studio .ppm or .kwz animation file. This attribute be changed at any time to load another Flipnote into the same image.

As with the player element, Flipnotes can also be loaded from other kinds of sources, such as from JavaScript [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) or [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) objects.

#### `frame`

The Flipnote frame to display as an image, this can be:

- Any numeric value to specify an exact frame index to show
- `"thumb"` to use the Flipnote's thumbnail frame
- `"all"` to show the entire animation as a non-interactive animated GIF

#### `cropped`

Set this to `"true"` to automatically crop out the border around the Flipnote frame. 