## EChartsLayer class

```bash
npm i @naivemap/mapbox-gl-echarts-layer echarts
```

<b>Signature:</b>

```typescript
export default class EChartsLayer implements mapboxgl.CustomLayerInterface
```

<b>Implements:</b> mapboxgl.CustomLayerInterface

## Constructors

| Constructor | Description |
| --- | --- |
| (constructor)(`id`: `string`, `option`: `ECOption`) | Constructs a new instance of the <code>EChartsLayer</code> class |

### Parameters

**id** `(string)` The ID of the layer.

**option** `(ECOption)` The option of the [Lines graph](https://echarts.apache.org/zh/option.html#series-lines) and [Scatter (bubble) chart](https://echarts.apache.org/zh/option.html#series-scatter).

```ts
export type ECOption = echarts.ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | LinesSeriesOption
  | ScatterSeriesOption
  | EffectScatterSeriesOption
>
```

### Methods

| Method                             | Description                                             |
| ---------------------------------- | ------------------------------------------------------- |
| **setOption** `(option: ECOption)` | Call `echartsInstance.setOption()` to update the chart. |

## Example

```ts
// echart option
const option = {...}
const layer = new EChartsLayer('layer-id', option)

map.addLayer(layer)
```
