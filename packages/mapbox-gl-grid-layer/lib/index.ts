import { satisfies } from 'compare-versions'
import earcut from 'earcut'
import mapboxgl from 'mapbox-gl'
import * as twgl from 'twgl.js'

import fs from './shaders/grid.fragment.glsl'
import vs from './shaders/grid.vertex.glsl'
import maskfs from './shaders/mask.fragment.glsl'
import maskvs from './shaders/mask.vertex.glsl'

import { getImageData } from './utils'

import { initArrugator } from './utils/arrugator'
import type { ArrugadoFlat, Coordinates } from './utils/arrugator'

export type { Coordinates } from './utils/arrugator'

export interface ColorOptions {
  type: 'unique' | 'classified' | 'stretched' // 唯一值 | 分类 | 拉伸
  colors: number[] | string
  values: number[]
}

export interface GridDataOptions {
  xStart: number
  yStart: number
  xDelta: number
  yDelta: number
  xSize: number
  ySize: number
  xEnd: number
  yEnd: number
  noData?: number
}

export type MaskProperty = {
  type?: 'in' | 'out' // 内遮罩(默认)，外遮罩
  data: GeoJSON.Polygon | GeoJSON.MultiPolygon
}

export type GridOption = {
  data: number[][]
  projection: string
  gridDataOptions: GridDataOptions
  colorOptions: ColorOptions
  resampling?: 'linear' | 'nearest'
  opacity?: number
  mask?: MaskProperty
}

export default class GridLayer implements mapboxgl.CustomLayerInterface {
  id: string
  type: 'custom' = 'custom'
  renderingMode?: '2d' | '3d' | undefined = '2d'

  private map?: mapboxgl.Map
  private gl?: WebGLRenderingContext

  private data: number[][]
  private gridDataOptions: GridDataOptions
  private colorOptions: ColorOptions
  private opacity: number

  private loaded: boolean
  private arrugado: ArrugadoFlat

  // texture
  private programInfo?: twgl.ProgramInfo
  private bufferInfo?: twgl.BufferInfo
  private texture?: WebGLTexture
  // mask
  private stencilChecked = true // resetStencilClippingMasks 版本检查
  private maskProperty: MaskProperty
  private maskProgramInfo?: twgl.ProgramInfo
  private maskBufferInfo?: twgl.BufferInfo

  constructor(id: string, option: GridOption) {
    this.id = id
    this.loaded = false
    this.data = option.data
    this.gridDataOptions = option.gridDataOptions
    this.colorOptions = option.colorOptions
    this.opacity = option.opacity ?? 1
    this.maskProperty = Object.assign({ type: 'in' }, option.mask)

    // 检查 stencil 是否可用
    this.stencilChecked = satisfies(mapboxgl.version, '>=2.7.0')
    // 如果传了 mask 边界数据，且版本不符
    if (this.maskProperty.data && !this.stencilChecked) {
      throw new Error(`如果需要遮罩（掩膜），mapbox-gl 版本必须：>=2.7.0`)
    }

    // 初始化 Arrugator
    const { xStart, xEnd, xDelta, yStart, yEnd, yDelta } = option.gridDataOptions
    this.arrugado = initArrugator(option.projection, [
      [xStart - xDelta / 2, yEnd + yDelta / 2], // top-left
      [xEnd + xDelta / 2, yEnd + yDelta / 2], // top-right
      [xEnd + xDelta / 2, yStart - yDelta / 2], // bottom-right
      [xStart - xDelta / 2, yStart - yDelta / 2], // bottom-left
    ])
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
        u_opacity: this.opacity || 1,
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
    const filter = this.colorOptions.type === 'stretched' ? gl.LINEAR : gl.NEAREST
    const imageData = getImageData(this.data, this.gridDataOptions, this.colorOptions, 1)
    this.texture = twgl.createTexture(gl, {
      width: this.gridDataOptions.xSize,
      height: this.gridDataOptions.ySize,
      src: imageData as number[],
      minMag: filter,
      flipY: 1,
    })

    this.loaded = true
    map.triggerRepaint()
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
