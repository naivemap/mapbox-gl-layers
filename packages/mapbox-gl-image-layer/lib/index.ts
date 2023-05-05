import { satisfies } from 'compare-versions'
import earcut from 'earcut'
import mapboxgl from 'mapbox-gl'
import * as twgl from 'twgl.js'

import fs from './shaders/image.fragment.glsl'
import vs from './shaders/image.vertex.glsl'
import maskfs from './shaders/mask.fragment.glsl'
import maskvs from './shaders/mask.vertex.glsl'

import { initArrugator } from './utils/arrugator'
import type { ArrugadoFlat, Coordinates } from './utils/arrugator'

export type { Coordinates } from './utils/arrugator'

export type MaskProperty = {
  type?: 'in' | 'out' // 内遮罩(默认)，外遮罩
  data: GeoJSON.Polygon | GeoJSON.MultiPolygon
}

export type ImageOption = {
  url: string
  projection: string
  coordinates: Coordinates
  resampling?: 'linear' | 'nearest'
  opacity?: number
  crossOrigin?: string
  mask?: MaskProperty
}

export default class ImageLayer implements mapboxgl.CustomLayerInterface {
  id: string
  type: 'custom' = 'custom'
  renderingMode?: '2d' | '3d' | undefined = '2d'
  private option: ImageOption

  private map?: mapboxgl.Map
  private gl?: WebGLRenderingContext

  private loaded: boolean
  private arrugado: ArrugadoFlat
  // private _program: WebGLProgram | null
  // private _texture: WebGLTexture | null
  // private _positionBuffer: WebGLBuffer | null
  // private _uvBuffer: WebGLBuffer | null
  // private _verticesIndexBuffer: WebGLBuffer | null
  // texture
  private programInfo?: twgl.ProgramInfo
  private bufferInfo?: twgl.BufferInfo
  private texture?: WebGLTexture
  // mask
  private stencilChecked = true // resetStencilClippingMasks 版本检查
  private maskProperty: MaskProperty
  private maskProgramInfo?: twgl.ProgramInfo
  private maskBufferInfo?: twgl.BufferInfo

  constructor(id: string, option: ImageOption) {
    this.id = id
    this.option = option
    this.loaded = false
    this.maskProperty = Object.assign({ type: 'in' }, option.mask)

    // 检查 stencil 是否可用
    this.stencilChecked = satisfies(mapboxgl.version, '>=2.7.0')
    // 如果传了 mask 边界数据，且版本不符
    if (this.maskProperty.data && !this.stencilChecked) {
      throw new Error(`如果需要遮罩（掩膜），mapbox-gl 版本必须：>=2.7.0`)
    }

    // 初始化 Arrugator
    const { projection, coordinates } = option
    this.arrugado = initArrugator(projection, coordinates)

    // this._map = null
    // this._gl = null
    // this._program = null
    // this._texture = null
    // this._positionBuffer = null
    // this._uvBuffer = null
    // this._verticesIndexBuffer = null
  }

  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    this.map = map
    this.gl = gl

    // 主程序
    this.programInfo = twgl.createProgramInfo(gl, [vs, fs])

    this.loadTexture(map, gl)
    this.bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_pos: { numComponents: 2, data: this.arrugado.pos },
      a_uv: { numComponents: 2, data: this.arrugado.uv },
      indices: this.arrugado.trigs,
    })

    // 掩膜程序
    if (this.maskProperty.data) {
      const { data } = this.maskProperty
      if (data) {
        this.maskProgramInfo = twgl.createProgramInfo(gl, [maskvs, maskfs])

        this.maskBufferInfo = this.getMaskBufferInfo(gl, data)
      }
    }
  }

  onRemove(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    if (this.programInfo) {
      gl.deleteProgram(this.programInfo.program)
    }
    if (this.maskProgramInfo) {
      gl.deleteProgram(this.maskProgramInfo.program)
    }
    if (this.texture) {
      gl.deleteTexture(this.texture)
    }
  }

  render(gl: WebGLRenderingContext, matrix: number[]): void {
    /**
     * 线图层在启用 stencil 会消失，参考: https://github.com/mapbox/mapbox-gl-js/issues/12213
     * 临时解决方案: map.painter.resetStencilClippingMasks()
     * 该方法在 mapboxgl version >=2.7.0 才能用
     */

    if (this.stencilChecked) {
      // @ts-ignore
      this.map.painter.resetStencilClippingMasks()
    }
    if (this.loaded && this.programInfo && this.bufferInfo) {
      // blend
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      if (this.maskProgramInfo && this.maskBufferInfo) {
        // mask program
        gl.useProgram(this.maskProgramInfo.program)

        // stencil test
        gl.enable(gl.STENCIL_TEST)
        gl.stencilFunc(gl.ALWAYS, 1, 0xff)
        gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE)
        gl.stencilMask(0xff)

        gl.clear(gl.STENCIL_BUFFER_BIT)

        // matrix
        twgl.setUniforms(this.maskProgramInfo, { u_matrix: matrix })
        // pos & indices
        twgl.setBuffersAndAttributes(gl, this.maskProgramInfo, this.maskBufferInfo)
        // draw
        let elementType: number = gl.UNSIGNED_SHORT
        if (this.maskBufferInfo.numElements / 3 > 65535) {
          // 使 drawElements 支持 UNSIGNED_INT 类型
          gl.getExtension('OES_element_index_uint')
          elementType = gl.UNSIGNED_INT
        }
        gl.drawElements(gl.TRIANGLES, this.maskBufferInfo.numElements, elementType, 0)
      }

      // texture program
      gl.useProgram(this.programInfo.program)

      if (this.maskProgramInfo?.program) {
        // stencil test
        const ref = this.maskProperty.type === 'out' ? 0 : 1
        gl.stencilFunc(gl.EQUAL, ref, 0xff)
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP)
      }

      // uniforms
      twgl.setUniforms(this.programInfo, {
        u_matrix: matrix,
        u_opacity: this.option.opacity || 1,
        u_sampler: this.texture,
      })
      // pos, uv & indices
      twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
      // draw
      gl.drawElements(gl.TRIANGLES, this.arrugado.trigs.length, gl.UNSIGNED_SHORT, 0)

      gl.clear(gl.STENCIL_BUFFER_BIT)
      gl.disable(gl.STENCIL_TEST)
    }
  }

  /**
   * Updates the URL, the projection, the coordinates, the opacity or the resampling of the image.
   * @param {Object} option Options object.
   * @param {string} [option.url] Image URL.
   * @param {string} [option.projection] Projection with EPSG code that points to the image..
   * @param {Array<Array<number>>} [option.coordinates] Four geographical coordinates,
   * @param {number} [option.opacity] opacity of the image.
   * @param {string} [option.resampling] The resampling/interpolation method to use for overscaling.
   */
  updateImage(option: {
    url?: string
    projection?: string
    coordinates?: Coordinates
    opacity?: number
    resampling?: 'linear' | 'nearest'
  }) {
    if (this.gl && this.map) {
      this.option.opacity = option.opacity ?? this.option.opacity
      if (option.projection || option.coordinates) {
        this.option.projection = option.projection ?? this.option.projection
        this.option.coordinates = option.coordinates ?? this.option.coordinates
        // reinit arrugator
        this.arrugado = initArrugator(this.option.projection, this.option.coordinates)
        this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, {
          a_pos: { numComponents: 2, data: this.arrugado.pos },
          a_uv: { numComponents: 2, data: this.arrugado.uv },
          indices: this.arrugado.trigs,
        })
      }
      if (option.url || option.resampling) {
        this.loaded = false
        this.option.url = option.url ?? this.option.url
        this.option.resampling = option.resampling ?? this.option.resampling
        // reload image
        this.loadTexture(this.map, this.gl)
      } else {
        this.map.triggerRepaint()
      }
    }
    return this
  }

  /**
   * Updates the mask property
   * @param {MaskProperty} mask The mask property.
   */
  updateMask(mask: Partial<MaskProperty>) {
    if (this.gl && this.map && this.maskProgramInfo) {
      this.maskProperty = Object.assign(this.maskProperty, mask)
      this.maskBufferInfo = this.getMaskBufferInfo(this.gl, this.maskProperty.data)
      this.map.triggerRepaint()
    }
    return this
  }

  private loadTexture(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    // 创建纹理
    const filter = this.option.resampling === 'nearest' ? gl.NEAREST : gl.LINEAR

    this.texture = twgl.createTexture(
      gl,
      {
        src: this.option.url,
        crossOrigin: this.option.crossOrigin,
        minMag: filter,
        flipY: 0,
      },
      () => {
        this.loaded = true
        map.triggerRepaint()
      }
    )
  }

  private getMaskBufferInfo(
    gl: WebGLRenderingContext,
    data: GeoJSON.Polygon | GeoJSON.MultiPolygon
  ) {
    let positions: number[] = []
    let triangles: number[] = []
    if (data.type === 'MultiPolygon') {
      // type: 'MultiPolygon'
      const polyCount = data.coordinates.length
      let triangleStartIndex = 0
      for (let i = 0; i < polyCount; i++) {
        const coordinates = data.coordinates[i]
        const flatten = earcut.flatten(coordinates)
        const { vertices, holes, dimensions } = flatten
        const triangle = earcut(vertices, holes, dimensions)
        const triangleNew = triangle.map((item) => item + triangleStartIndex)

        triangleStartIndex += vertices.length / 2
        // positions.push(...vertices)
        // triangles.push(...triangleNew)
        for (let m = 0; m < vertices.length; m++) {
          positions.push(vertices[m])
        }
        for (let n = 0; n < triangleNew.length; n++) {
          triangles.push(triangleNew[n])
        }
      }
    } else {
      // type: 'Polygon'
      const flatten = earcut.flatten(data.coordinates)
      const { vertices, holes, dimensions } = flatten
      positions = vertices
      triangles = earcut(vertices, holes, dimensions)
    }

    return twgl.createBufferInfoFromArrays(gl, {
      a_pos: { numComponents: 2, data: positions },
      indices:
        triangles.length / 3 > 65535 ? new Uint32Array(triangles) : new Uint16Array(triangles),
    })
  }
}
