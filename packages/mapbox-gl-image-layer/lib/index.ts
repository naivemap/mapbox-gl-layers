import { loadImage } from './utils/image'
import { createProgram } from './utils/webgl'
import { initArrugator } from './utils/arrugator'
import type { ArrugadoFlat, Coordinates } from './utils/arrugator'

export type ImageOption = {
  url: string
  projection: string
  coordinates: Coordinates
  resampling?: 'linear' | 'nearest'
  crossOrigin?: string
}

export default class ImageLayer implements mapboxgl.CustomLayerInterface {
  id: string
  type: 'custom'
  renderingMode?: '2d' | '3d' | undefined
  private _option: ImageOption
  private _loaded: boolean
  private _arrugado: ArrugadoFlat
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
    this._arrugado = initArrugator(projection, coordinates)

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
      // gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer)
      // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._arrugado.pos), gl.STATIC_DRAW)
      const a_pos = gl.getAttribLocation(this._program, 'a_pos')
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(a_pos)

      this._uvBuffer = gl.createBuffer()
      // gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer)
      // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._arrugado.uv), gl.STATIC_DRAW)
      const a_uv = gl.getAttribLocation(this._program, 'a_uv')
      gl.vertexAttribPointer(a_uv, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(a_uv)

      this._verticesIndexBuffer = gl.createBuffer()
      // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._verticesIndexBuffer)
      // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._arrugado.trigs), gl.STATIC_DRAW)

      this._bindData(gl, this._arrugado)
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

  /**
   * Updates the image URL and, optionally, the projection, the coordinates and the resampling.
   * @param {Object} option Options object.
   * @param {string} [option.url] Required image URL.
   * @param {string} [option.projection] Projection with EPSG code that points to the image..
   * @param {Array<Array<number>>} [option.coordinates] Four geographical coordinates,
   * @param {string} [option.resampling] The resampling/interpolation method to use for overscaling.
   */
  updateImage(option: {
    url: string
    projection?: string
    coordinates?: Coordinates
    resampling?: 'linear' | 'nearest'
  }) {
    this._loaded = false
    this._option.url = option.url

    if (this._gl && this._map) {
      if (option.projection || option.coordinates) {
        this._option.projection = option.projection ?? this._option.projection
        this._option.coordinates = option.coordinates ?? this._option.coordinates

        // reinit arrugator
        this._arrugado = initArrugator(this._option.projection, this._option.coordinates)
        this._bindData(this._gl, this._arrugado)
      }

      this._option.resampling = option.resampling ?? this._option.resampling
      // reload image
      this._loadImage(this._map, this._gl)
    }

    return this
  }

  private _bindData(gl: WebGLRenderingContext, arrugado: ArrugadoFlat) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrugado.pos), gl.STATIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrugado.uv), gl.STATIC_DRAW)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._verticesIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrugado.trigs), gl.STATIC_DRAW)
  }

  private _loadImage(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    loadImage(this._option.url, this._option.crossOrigin).then((img) => {
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
