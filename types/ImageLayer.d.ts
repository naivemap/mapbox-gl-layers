/// <reference types="mapbox-gl" />
declare type Coordinates = [[number, number], [number, number], [number, number], [number, number]]
export declare type ImageOption = {
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
  private _option
  private _loaded
  private _arrugado
  private _program
  private _texture
  private _verticesIndexBuffer
  constructor(id: string, option: ImageOption)
  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext): void
  onRemove(map: mapboxgl.Map, gl: WebGLRenderingContext): void
  render(gl: WebGLRenderingContext, matrix: number[]): void
  update(url: string): void
  private _initArrugator
}
