export default `
uniform mat4 u_matrix;
uniform float u_alt;
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;

const float PI = 3.1415926536;
const float earthRadius = 6371008.8;
const float earthCircumference = 2.0 * PI * earthRadius; // meters

float circumferenceAtLatitude(float latitude) {
  return earthCircumference * cos(latitude * PI / 180.0);
}

float mercatorXfromLng(float lng) {
  return (180.0 + lng) / 360.0;
}

float mercatorYfromLat(float lat) {
  return (180.0 - (180.0 / PI * log(tan(PI / 4.0 + lat * PI / 360.0)))) / 360.0;
}

float mercatorZfromAltitude(float altitude, float lat) {
  return altitude / circumferenceAtLatitude(lat);
}

vec2 mercatorfromLngLat(vec2 lnglat) {
  return vec2(mercatorXfromLng(lnglat.x), mercatorYfromLat(lnglat.y));
}

void main() {
  gl_Position = u_matrix * vec4(a_pos, mercatorZfromAltitude(u_alt, a_pos.y), 1.0);
  v_uv = a_uv;
}
`
