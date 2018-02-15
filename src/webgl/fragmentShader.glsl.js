export default `
precision mediump float;
varying vec2 v_texcoord;
uniform vec4 u_paperColor;
uniform vec4 u_layer1Color;
uniform vec4 u_layer2Color;
uniform sampler2D u_layer1Bitmap;
uniform sampler2D u_layer2Bitmap;

void main() {
  float layer1 = texture2D(u_layer1Bitmap, v_texcoord).a * 255.0;
  float layer2 = texture2D(u_layer2Bitmap, v_texcoord).a * 255.0;
  gl_FragColor = mix(mix(u_paperColor, u_layer2Color, layer2), u_layer1Color, layer1);
}`
