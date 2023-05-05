export default `
#ifdef GL_ES
  precision highp int;
  precision mediump float;
#endif
uniform sampler2D u_sampler;
uniform float u_opacity;
varying vec2 v_uv;
void main() {
  vec4 color = texture2D(u_sampler, v_uv);
  gl_FragColor = color * u_opacity;
}
`
