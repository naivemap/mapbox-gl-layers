[Home](./index.md) &gt; [@naivemap/mapbox-gl-layers](./mapbox-gl-layers.md) &gt; [EChartsLayer](./mapbox-gl-layers.echartslayer.md)

## EChartsLayer class

<b>Signature:</b>

```typescript
export default class EChartsLayer implements mapboxgl.CustomLayerInterface 
```
<b>Implements:</b> mapboxgl.CustomLayerInterface

## Constructors

|  Constructor | Description |
|  --- | --- |
|  (constructor)(id, ecOption) | Constructs a new instance of the <code>EChartsLayer</code> class |

## Methods

|  Method | Description |
|  --- | --- |
|  [setOption(option)](./mapbox-gl-layers.echartslayer.setoption.md) |  |

## Example

```ts
// echart option
const option = {...}
const layer = new EChartsLayer('layer-id', option)

map.addLayer(layer)
```