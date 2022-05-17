import Arrugator from 'arrugator'
import proj4 from 'proj4'

import { loadImage } from '../util/image'
import { createProgram } from '../util/webgl'

// top left, top right, bottom right, bottom left.
type Coordinates = [[number, number], [number, number], [number, number], [number, number]]

type Arrugado = {
  unprojected: [number, number][]
  projected: [number, number][]
  uv: [number, number][]
  trigs: [number, number][]
}

export type ImageOption = {
  url: string
  projection: string
  coordinates: Coordinates
  resampling: 'linear' | 'nearest'
}

export default class ImageLayer implements mapboxgl.CustomLayerInterface {
  id: string
  type: 'custom'
  renderingMode?: '2d' | '3d' | undefined
  private _option: ImageOption
  private _loaded: boolean
  private _arrugado: {
    pos: number[]
    uv: number[]
    trigs: number[]
  }
  private _map: mapboxgl.Map | null
  private _gl: WebGLRenderingContext | null
  private _program: WebGLProgram | null
  private _texture: WebGLTexture | null
  private _positionBuffer: WebGLBuffer | null
  private _uvBuffer: WebGLBuffer | null
  private _verticesIndexBuffer: WebGLBuffer | null

  constructor(id: string, option: ImageOption) {
    this.id = id
    this.type = 'custom'
    this.renderingMode = '2d'
    this._option = option
    this._loaded = false

    // 初始化 Arrugator
    const { projection, coordinates } = option
    const arrugado = this._initArrugator(projection, coordinates)
    this._arrugado = {
      pos: arrugado.projected.flat(), // mapbox 墨卡托坐标
      uv: arrugado.uv.flat(), // uv 纹理
      trigs: arrugado.trigs.flat(), // 三角形索引
    }

    this._map = null
    this._gl = null
    this._program = null
    this._texture = null
    this._positionBuffer = null
    this._uvBuffer = null
    this._verticesIndexBuffer = null
  }

  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    this._map = map
    this._gl = gl
    this._loadImage(map, gl)

    const vertexSource = `
      uniform mat4 u_matrix;
      attribute vec2 a_pos;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      void main() {
        gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
        v_uv = a_uv;
      }`

    const fragmentSource = `
      #ifdef GL_ES
        precision highp int;
        precision mediump float;
      #endif
      uniform sampler2D u_sampler;
      varying vec2 v_uv;
      void main() {
        gl_FragColor = texture2D(u_sampler, v_uv);
      }`

    this._program = createProgram(gl, vertexSource, fragmentSource)

    if (this._program) {
      this._positionBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._arrugado.pos), gl.STATIC_DRAW)
      const a_pos = gl.getAttribLocation(this._program, 'a_pos')
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(a_pos)

      this._uvBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._arrugado.uv), gl.STATIC_DRAW)
      const a_uv = gl.getAttribLocation(this._program, 'a_uv')
      gl.vertexAttribPointer(a_uv, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(a_uv)

      this._verticesIndexBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._verticesIndexBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._arrugado.trigs), gl.STATIC_DRAW)
    }
  }

  onRemove(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    gl.deleteProgram(this._program)
    gl.deleteTexture(this._texture)
    gl.deleteBuffer(this._verticesIndexBuffer)
  }

  render(gl: WebGLRenderingContext, matrix: number[]): void {
    if (this._loaded && this._program) {
      gl.useProgram(this._program)

      // matrix
      gl.uniformMatrix4fv(gl.getUniformLocation(this._program, 'u_matrix'), false, matrix)
      // pos
      gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer)
      gl.vertexAttribPointer(gl.getAttribLocation(this._program, 'a_pos'), 2, gl.FLOAT, false, 0, 0)
      // uv
      gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer)
      gl.vertexAttribPointer(gl.getAttribLocation(this._program, 'a_uv'), 2, gl.FLOAT, false, 0, 0)

      // index
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._verticesIndexBuffer)

      // texture
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this._texture)
      gl.uniform1i(gl.getUniformLocation(this._program, 'u_sampler'), 0)

      gl.drawElements(gl.TRIANGLES, this._arrugado.trigs.length, gl.UNSIGNED_SHORT, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
    }
  }

  update(url: string) {
    this._loaded = false
    this._option.url = url

    if (this._gl && this._map) {
      this._loadImage(this._map, this._gl)
    }
  }

  private _initArrugator(fromProj: string, coordinates: Coordinates): Arrugado {
    // 墨卡托投影的左上角坐标，对应 mapbox 左上角起始坐标 [0,0]
    const origin = [-20037508.342789244, 20037508.342789244]
    // 坐标转换为 Arrugator 坐标 top-left, top-left, top-left, top-left)
    const verts = [coordinates[0], coordinates[3], coordinates[1], coordinates[2]]
    // 转换为 EPSG:3857
    const projector = proj4(fromProj, 'EPSG:3857').forward
    // 改写坐标转换函数，因为 mapbox 的墨卡托坐标是 0-1，并且对应地理范围与标准 3857 不同
    function forward(coors: [number, number]) {
      // 墨卡托坐标
      const coor_3857 = projector(coors)
      // 墨卡托坐标转换到 0-1 区间，origin 对应 mapbox 0 0点
      const mapbox_coor1 = Math.abs((coor_3857[0] - origin[0]) / (20037508.342789244 * 2))
      const mapbox_coor2 = Math.abs((coor_3857[1] - origin[1]) / (20037508.342789244 * 2))
      return [mapbox_coor1, mapbox_coor2]
    }
    const epsilon = 0.00000000001
    // 纹理uv坐标
    const sourceUV = [
      [0, 0], // top-left
      [0, 1], // bottom-left
      [1, 0], // top-right
      [1, 1], // bottom-right
    ]
    const arrugator = new Arrugator(forward, verts, sourceUV, [
      [0, 1, 3],
      [0, 3, 2],
    ])

    arrugator.lowerEpsilon(epsilon)

    return arrugator.output()
  }

  private _loadImage(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    loadImage(this._option.url).then((img) => {
      this._loaded = true

      // 创建纹理
      this._texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, this._texture)

      const textureFilter = this._option.resampling === 'nearest' ? gl.NEAREST : gl.LINEAR

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, textureFilter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, textureFilter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

      map.triggerRepaint()
    })
  }
}
