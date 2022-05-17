import proj4 from "proj4";
import * as echarts from "echarts";
class TinyQueue {
  constructor(data = [], compare = defaultCompare) {
    this.data = data;
    this.length = this.data.length;
    this.compare = compare;
    if (this.length > 0) {
      for (let i = (this.length >> 1) - 1; i >= 0; i--)
        this._down(i);
    }
  }
  push(item) {
    this.data.push(item);
    this.length++;
    this._up(this.length - 1);
  }
  pop() {
    if (this.length === 0)
      return void 0;
    const top = this.data[0];
    const bottom = this.data.pop();
    this.length--;
    if (this.length > 0) {
      this.data[0] = bottom;
      this._down(0);
    }
    return top;
  }
  peek() {
    return this.data[0];
  }
  _up(pos) {
    const { data, compare } = this;
    const item = data[pos];
    while (pos > 0) {
      const parent = pos - 1 >> 1;
      const current = data[parent];
      if (compare(item, current) >= 0)
        break;
      data[pos] = current;
      pos = parent;
    }
    data[pos] = item;
  }
  _down(pos) {
    const { data, compare } = this;
    const halfLength = this.length >> 1;
    const item = data[pos];
    while (pos < halfLength) {
      let left = (pos << 1) + 1;
      let best = data[left];
      const right = left + 1;
      if (right < this.length && compare(data[right], best) < 0) {
        left = right;
        best = data[right];
      }
      if (compare(best, item) >= 0)
        break;
      data[pos] = best;
      pos = left;
    }
    data[pos] = item;
  }
}
function defaultCompare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
class Arrugator {
  constructor(projector, verts, uv, trigs) {
    this._projector = projector;
    this._verts = verts;
    this._uv = uv;
    this._projVerts = verts.map(projector);
    this._trigs = trigs;
    this._segs = [];
    this._segCount = 0;
    this._segTrigs = [];
    this._epsilons = [];
    this._queue = new TinyQueue([], function(a, b) {
      return b.epsilon - a.epsilon;
    });
    this._vertToSeg = new Array(verts.length);
    for (let i in this._verts) {
      this._vertToSeg[i] = [];
    }
    for (let t in this._trigs) {
      let trig = this._trigs[t];
      let v0 = trig[0];
      let v1 = trig[1];
      let v2 = trig[2];
      this._segment(v0, v1, t);
      this._segment(v1, v2, t);
      this._segment(v2, v0, t);
    }
  }
  _segment(v1, v2, t) {
    if (this._vertToSeg[v1] && this._vertToSeg[v1][v2] !== void 0) {
      const found = this._vertToSeg[v1][v2];
      if (!this._segTrigs[found].includes(t)) {
        this._segTrigs[found].push(t);
      }
      return found;
    }
    const segIdx = this._segCount++;
    this._segs[segIdx] = [v1, v2];
    this._vertToSeg[v1][v2] = segIdx;
    this._vertToSeg[v2][v1] = segIdx;
    this._segTrigs[segIdx] = [t];
    const midpoint = [
      (this._verts[v1][0] + this._verts[v2][0]) / 2,
      (this._verts[v1][1] + this._verts[v2][1]) / 2
    ];
    const projectedMid = this._projector(midpoint);
    const midProjected = [
      (this._projVerts[v1][0] + this._projVerts[v2][0]) / 2,
      (this._projVerts[v1][1] + this._projVerts[v2][1]) / 2
    ];
    const epsilon = (projectedMid[0] - midProjected[0]) ** 2 + (projectedMid[1] - midProjected[1]) ** 2;
    this._queue.push({
      v1,
      v2,
      epsilon,
      midpoint,
      projectedMid
    });
    return segIdx;
  }
  output() {
    return {
      unprojected: Array.from(this._verts),
      projected: Array.from(this._projVerts),
      uv: Array.from(this._uv),
      trigs: Array.from(this._trigs)
    };
  }
  lowerEpsilon(targetEpsilon) {
    while (this._queue.peek().epsilon > targetEpsilon) {
      this.step();
    }
  }
  step() {
    const top = this._queue.pop();
    const v1 = top.v1;
    const v2 = top.v2;
    const s = this._vertToSeg[v1] && this._vertToSeg[v1][v2];
    const trigs = this._segTrigs[s];
    if (trigs.length >= 3) {
      throw new Error("Somehow a segment is shared by three triangles");
    }
    delete this._segTrigs[s];
    delete this._segs[s];
    delete this._vertToSeg[v1][v2];
    delete this._vertToSeg[v2][v1];
    const vm = this._verts.length;
    this._projVerts[vm] = top.projectedMid;
    this._verts[vm] = top.midpoint;
    this._vertToSeg[vm] = [];
    this._uv[vm] = [
      (this._uv[v1][0] + this._uv[v2][0]) / 2,
      (this._uv[v1][1] + this._uv[v2][1]) / 2
    ];
    for (let t of trigs) {
      this._splitTriangle(v1, v2, vm, t);
    }
  }
  _splitTriangle(v1, v2, vm, t) {
    const tvs = this._trigs[t];
    let v3;
    let winding = false;
    if (tvs[0] === v1 && tvs[1] === v2) {
      v3 = tvs[2];
      winding = true;
    } else if (tvs[1] === v1 && tvs[2] === v2) {
      v3 = tvs[0];
      winding = true;
    } else if (tvs[2] === v1 && tvs[0] === v2) {
      v3 = tvs[1];
      winding = true;
    } else if (tvs[1] === v1 && tvs[0] === v2) {
      v3 = tvs[2];
      winding = false;
    } else if (tvs[2] === v1 && tvs[1] === v2) {
      v3 = tvs[0];
      winding = false;
    } else if (tvs[0] === v1 && tvs[2] === v2) {
      v3 = tvs[1];
      winding = false;
    } else {
      throw new Error("Data structure mishap: could not fetch 3rd vertex used in triangle");
    }
    const t2 = this._trigs.length;
    if (winding) {
      this._trigs[t] = [v1, vm, v3];
      this._trigs[t2] = [vm, v2, v3];
    } else {
      this._trigs[t] = [vm, v1, v3];
      this._trigs[t2] = [v2, vm, v3];
    }
    const s1 = this._vertToSeg[v1] && this._vertToSeg[v1][v2];
    const s2 = this._vertToSeg[v2] && this._vertToSeg[v2][v3];
    const s3 = this._vertToSeg[v3] && this._vertToSeg[v3][v1];
    function filterTrig(i) {
      return i !== t;
    }
    if (s1 !== void 0) {
      this._segTrigs[s1] = this._segTrigs[s1].filter(filterTrig);
    }
    if (s2 !== void 0) {
      this._segTrigs[s2] = this._segTrigs[s2].filter(filterTrig);
    }
    if (s3 !== void 0) {
      this._segTrigs[s3] = this._segTrigs[s3].filter(filterTrig);
    }
    this._segment(v1, vm, t);
    this._segment(vm, v3, t);
    this._segment(v3, v1, t);
    this._segment(v2, vm, t2);
    this._segment(vm, v3, t2);
    this._segment(v3, v2, t2);
  }
}
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.src = src;
    img.onload = function() {
      res(img);
    };
    img.onerror = function() {
      rej("error");
    };
  });
}
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (shader == null) {
    console.log("unable to create shader");
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    const error = gl.getShaderInfoLog(shader);
    console.log("Failed to compile shader: " + error);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
function createProgram(gl, vshader, fshader) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vshader);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fshader);
  if (!vertexShader || !fragmentShader) {
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    return null;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    const error = gl.getProgramInfoLog(program);
    console.log("Failed to link program: " + error);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    return null;
  }
  return program;
}
class ImageLayer {
  constructor(id, option) {
    this.id = id;
    this.type = "custom";
    this.renderingMode = "2d";
    this._option = option;
    this._loaded = false;
    const { projection, coordinates } = option;
    const arrugado = this._initArrugator(projection, coordinates);
    this._arrugado = {
      pos: arrugado.projected.flat(),
      uv: arrugado.uv.flat(),
      trigs: arrugado.trigs.flat()
    };
    this._map = null;
    this._gl = null;
    this._program = null;
    this._texture = null;
    this._positionBuffer = null;
    this._uvBuffer = null;
    this._verticesIndexBuffer = null;
  }
  onAdd(map, gl) {
    this._map = map;
    this._gl = gl;
    this._loadImage(map, gl);
    const vertexSource = `
      uniform mat4 u_matrix;
      attribute vec2 a_pos;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      void main() {
        gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
        v_uv = a_uv;
      }`;
    const fragmentSource = `
      #ifdef GL_ES
        precision highp int;
        precision mediump float;
      #endif
      uniform sampler2D u_sampler;
      varying vec2 v_uv;
      void main() {
        gl_FragColor = texture2D(u_sampler, v_uv);
      }`;
    this._program = createProgram(gl, vertexSource, fragmentSource);
    if (this._program) {
      this._positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._arrugado.pos), gl.STATIC_DRAW);
      const a_pos = gl.getAttribLocation(this._program, "a_pos");
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_pos);
      this._uvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._arrugado.uv), gl.STATIC_DRAW);
      const a_uv = gl.getAttribLocation(this._program, "a_uv");
      gl.vertexAttribPointer(a_uv, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_uv);
      this._verticesIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._verticesIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._arrugado.trigs), gl.STATIC_DRAW);
    }
  }
  onRemove(map, gl) {
    gl.deleteProgram(this._program);
    gl.deleteTexture(this._texture);
    gl.deleteBuffer(this._verticesIndexBuffer);
  }
  render(gl, matrix) {
    if (this._loaded && this._program) {
      gl.useProgram(this._program);
      gl.uniformMatrix4fv(gl.getUniformLocation(this._program, "u_matrix"), false, matrix);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
      gl.vertexAttribPointer(gl.getAttribLocation(this._program, "a_pos"), 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
      gl.vertexAttribPointer(gl.getAttribLocation(this._program, "a_uv"), 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._verticesIndexBuffer);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      gl.uniform1i(gl.getUniformLocation(this._program, "u_sampler"), 0);
      gl.drawElements(gl.TRIANGLES, this._arrugado.trigs.length, gl.UNSIGNED_SHORT, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
  }
  update(url) {
    this._loaded = false;
    this._option.url = url;
    if (this._gl && this._map) {
      this._loadImage(this._map, this._gl);
    }
  }
  _initArrugator(fromProj, coordinates) {
    const origin = [-20037508342789244e-9, 20037508342789244e-9];
    const verts = [coordinates[0], coordinates[3], coordinates[1], coordinates[2]];
    const projector = proj4(fromProj, "EPSG:3857").forward;
    function forward(coors) {
      const coor_3857 = projector(coors);
      const mapbox_coor1 = Math.abs((coor_3857[0] - origin[0]) / (20037508342789244e-9 * 2));
      const mapbox_coor2 = Math.abs((coor_3857[1] - origin[1]) / (20037508342789244e-9 * 2));
      return [mapbox_coor1, mapbox_coor2];
    }
    const epsilon = 1e-11;
    const sourceUV = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1]
    ];
    const arrugator = new Arrugator(forward, verts, sourceUV, [
      [0, 1, 3],
      [0, 3, 2]
    ]);
    arrugator.lowerEpsilon(epsilon);
    return arrugator.output();
  }
  _loadImage(map, gl) {
    loadImage(this._option.url).then((img) => {
      this._loaded = true;
      this._texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      const textureFilter = this._option.resampling === "nearest" ? gl.NEAREST : gl.LINEAR;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, textureFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, textureFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      map.triggerRepaint();
    });
  }
}
const COORDINATE_SYSTEM_NAME = "mapboxgl-echarts";
class CoordinateSystem {
  constructor(map) {
    this.dimensions = ["x", "y"];
    this._mapOffset = [0, 0];
    this.map = map;
  }
  create(ecModel) {
    ecModel.eachSeries((seriesModel) => {
      if (seriesModel.get("coordinateSystem") === COORDINATE_SYSTEM_NAME) {
        seriesModel.coordinateSystem = new CoordinateSystem(this.map);
      }
    });
  }
  dataToPoint(data) {
    const px = this.map.project(data);
    const mapOffset = this._mapOffset;
    return [px.x - mapOffset[0], px.y - mapOffset[1]];
  }
  pointToData(pt) {
    const mapOffset = this._mapOffset;
    const data = this.map.unproject([pt[0] + mapOffset[0], pt[1] + mapOffset[1]]);
    return [data.lng, data.lat];
  }
}
class EChartsLayer {
  constructor(id, ecOption) {
    this._registered = false;
    this.id = id;
    this.type = "custom";
    this.renderingMode = "2d";
    this._coordSystemName = COORDINATE_SYSTEM_NAME;
    this._ecOption = ecOption;
  }
  onAdd(map) {
    this._map = map;
    this._createLayerContainer();
  }
  onRemove() {
    var _a;
    (_a = this._ec) == null ? void 0 : _a.dispose();
    this._removeLayerContainer();
  }
  setOption(option) {
    var _a;
    (_a = this._ec) == null ? void 0 : _a.setOption(option);
  }
  render() {
    if (!this._container) {
      this._createLayerContainer();
    }
    if (!this._ec) {
      this._ec = echarts.init(this._container);
      this._prepareECharts();
      this._ec.setOption(this._ecOption);
    } else {
      if (this._map.isMoving()) {
        this._ec.clear();
      } else {
        this._ec.resize({
          width: this._map.getCanvas().width,
          height: this._map.getCanvas().height
        });
        this._ec.setOption(this._ecOption);
      }
    }
  }
  _prepareECharts() {
    if (!this._registered) {
      const coordinateSystem = new CoordinateSystem(this._map);
      echarts.registerCoordinateSystem(this._coordSystemName, coordinateSystem);
      this._registered = true;
    }
    const series = this._ecOption.series;
    if (series) {
      for (let i = series.length - 1; i >= 0; i--) {
        series[i]["coordinateSystem"] = this._coordSystemName;
      }
    }
  }
  _createLayerContainer() {
    const mapContainer = this._map.getCanvasContainer();
    this._container = document.createElement("div");
    this._container.style.width = this._map.getCanvas().style.width;
    this._container.style.height = this._map.getCanvas().style.height;
    mapContainer.appendChild(this._container);
  }
  _removeLayerContainer() {
    var _a;
    if (this._container) {
      (_a = this._container.parentNode) == null ? void 0 : _a.removeChild(this._container);
    }
  }
}
export { EChartsLayer, ImageLayer };
