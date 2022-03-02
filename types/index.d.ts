/// <reference types="mapbox-gl" />
import * as echarts from 'echarts'
import {
  EffectScatterSeriesOption,
  LegendComponentOption,
  LinesSeriesOption,
  ScatterSeriesOption,
  TitleComponentOption,
  TooltipComponentOption,
} from 'echarts'
export declare type ECOption = echarts.ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | LinesSeriesOption
  | ScatterSeriesOption
  | EffectScatterSeriesOption
>
export default class EchartsLayer implements mapboxgl.CustomLayerInterface {
  id: string
  type: 'custom'
  renderingMode: '2d'
  private _container
  private _map
  private _ec
  private _coordSystemName
  private _registered
  private _ecOption
  constructor(id: string, ecOption: ECOption)
  onAdd(map: mapboxgl.Map): void
  onRemove(): void
  setOption(option: ECOption): void
  render(): void
  private _prepareECharts
  private _createLayerContainer
  private _removeLayerContainer
}
