import { initArrugator } from './util/arrugator'
import { loadImage } from './util/image'
import {
  bindAttribute,
  bindTexture2D,
  createBuffer,
  createIndicesBuffer,
  createModel,
  createTexture2D,
} from './webgl_util'

type Coordinates = [[number, number], [number, number], [number, number], [number, number]]

export type ImageOption = {
  url: string
  projection: string
  coordinates: Coordinates
}

export default class ImageLayer implements mapboxgl.CustomLayerInterface {
  id: string
  type: 'custom'
  renderingMode?: '2d' | '3d' | undefined
  private _option: ImageOption
  private _loaded: boolean
  private _arrugado: Arrugado
  private _elementType: any
  private _positionCount: number | undefined
  private _texture: any
  private _drawModel: any

  constructor(id: string, option: ImageOption) {
    this.id = id
    this.type = 'custom'
    this.renderingMode = '2d'
    this._option = option
    this._loaded = false

    // 初始化 Arrugator
    const { projection, coordinates } = option
    const arrugado = initArrugator(projection, 'EPSG:3857', coordinates)
    this._arrugado = arrugado
  }

  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    // 加载图片
    loadImage(this._option.url).then((img) => {
      this._loaded = true

      // 创建纹理
      this._texture = createTexture2D(gl, {
        data: img,
        mipLevel: 0,
        internalFormat: gl.RGBA, //webgl中格式
        srcFormat: gl.RGBA, //输入数据源格式
        type: gl.UNSIGNED_BYTE,
        parameters: {
          [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
          [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
          [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
          [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE,
        },
      })

      map.triggerRepaint()
    })

    // 墨卡托坐标转mapbox的墨卡托坐标
    const pos = this._arrugado.projected.flat()
    // uv纹理
    const uv = this._arrugado.uv.flat()
    // 三角形index
    const trigs = this._arrugado.trigs.flat()

    // create GLSL source for vertex shader
    const vertexSource = `
        uniform mat4 u_matrix;
        attribute vec2 a_pos;
        attribute vec2 a_uv;
        varying vec2 v_uv;
        void main() {
          gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
          v_uv = a_uv;
        }`

    // create GLSL source for fragment shader
    const fragmentSource = `
        #ifdef GL_ES
          precision highp int;
          precision mediump float;
        #endif
        uniform sampler2D u_Sampler;
        varying vec2 v_uv;
        void main() {
          gl_FragColor = texture2D(u_Sampler, v_uv);
        }`

    // Initialize shaders
    this._drawModel = createModel(gl, vertexSource, fragmentSource)

    const positionBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(pos))
    bindAttribute(gl, positionBuffer, 0, 2)

    const uvBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(uv))
    bindAttribute(gl, uvBuffer, 1, 2)

    // 顶点索引，unit8array对应gl.UNSIGNED_BYTE
    this._elementType = createIndicesBuffer(gl, trigs, pos.length / 2)
    this._positionCount = trigs.length
  }

  onRemove(map: mapboxgl.Map, gl: WebGLRenderingContext) {}

  render(gl: WebGLRenderingContext, matrix: number[]): void {
    if (this._loaded && this._drawModel) {
      gl.useProgram(this._drawModel.program)
      //设置unifrom
      gl.uniformMatrix4fv(this._drawModel.u_matrix, false, matrix)
      // //绑定顶点vao
      // gl.bindVertexArray(this._vao)
      // // 绑定纹理
      // //只设置初始纹理并展示，纹理单元从10之后开始用，尽量避免冲突bug
      bindTexture2D(gl, this._texture, 10)
      gl.uniform1i(this._drawModel.u_Sampler, 10)

      // gl.clear(gl.DEPTH_BUFFER_BIT)
      gl.drawElements(gl.TRIANGLES, this._positionCount!, this._elementType, 0)
      // //如果取消绑定，会报错GL_INVALID_OPERATION: Insufficient buffer size.
      // gl.bindVertexArray(null)
    }
  }
}
