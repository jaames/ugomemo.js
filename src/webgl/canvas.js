import vertexShader from "./vertexShader.glsl.js";
import fragmentShader from "./fragmentShader.glsl.js";

/** webgl canvas wrapper class */
export default class webglCanvas {
  /**
  * Create a rendering canvas
  * @param {HTMLCanvasElement} el - The HTML canvas element
  * @param {number} width - width of the canvas in pixels
  * @param {number} height - height of the canvas in pixels
  * @param {Object} params - optional params to pass to web gl context
  */
  constructor(el, width, height, params) {
    el.width = width || 256;
    el.height = height || 192; 
    var gl = el.getContext("webgl", params || {antialias: false});
    var program = gl.createProgram();
    this.program = program;
    this.el = el;
    this.gl = gl;
    this._createShader(gl.VERTEX_SHADER, vertexShader);
    this._createShader(gl.FRAGMENT_SHADER, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    // create quad that fills the screen, this will be our drawing surface
    var vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1,  1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    // create textures for each layer
    this._createTexture("u_layer1Bitmap", 0, gl.TEXTURE0);
    this._createTexture("u_layer2Bitmap", 1, gl.TEXTURE1);
  }

  /**
  * Util to compile and attach a new shader
  * @param {shader type} type - gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
  * @param {string} source - GLSL code for the shader
  * @access protected 
  */
  _createShader(type, source) {
    var gl = this.gl;
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(this.program, shader);
  }

  /**
  * Util to set up a texture
  * @param {string} name - name of the texture's uniform variable
  * @param {number} index - texture index
  * @param {texture} texture - webgl texture unit, gl.TEXTURE0, gl.TEXTURE1, etc
  * @access protected 
  */
  _createTexture(name, index, texture) {
    var gl = this.gl;
    gl.uniform1i(gl.getUniformLocation(this.program, name), index);
    gl.activeTexture(texture);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  /**
  * Set an palette individual color
  * @param {string} color - name of the color's uniform variable
  * @param {array} value - r,g,b,a color, each channel's value should be between 0.0 and 1.0
  */
  setColor(color, value) {
    this.gl.uniform4f(this.gl.getUniformLocation(this.program, color), value[0]/255, value[1]/255, value[2]/255, value[3]/255);
  }

  /**
  * Set the palette
  * @param {array} colors - array of r,g,b,a colors with channel values from 0.0 to 1.0, in order of paper, layer1, layer2
  */
  setPalette(colors) {
    this.setColor("u_paperColor", colors[0]);
    this.setColor("u_layer1Color", colors[1]);
    this.setColor("u_layer2Color", colors[2]);
  }

  /**
  * Set layer bitmaps
  * @param {array} buffers - array of two uint8 buffers, one for each layer
  */
  setBitmaps(buffers) {
    var gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, 256, 192, 0, gl.ALPHA, gl.UNSIGNED_BYTE, buffers[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, 256, 192, 0, gl.ALPHA, gl.UNSIGNED_BYTE, buffers[1]);
  }

  /**
  * Resize canvas
  * @param {number} width - width of the canvas in pixels
  * @param {number} height - height of the canvas in pixels
  */
  resize(width=256, height=192) {
    this.el.width = width;
    this.el.height = height; 
    this.gl.viewport(0, 0, width, height);
  }

  /**
  * Redraw canvas
  */
  refresh() {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  /**
  * Clear canvas
  */
  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
}