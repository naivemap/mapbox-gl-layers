import * as echarts from "echarts";
import Arrugator from "arrugator";
import proj4 from "proj4";
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
    this._program = null;
    this._texture = null;
    this._positionBuffer = null;
    this._uvBuffer = null;
    this._verticesIndexBuffer = null;
  }
  onAdd(map, gl) {
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
}
export { EChartsLayer, ImageLayer };
