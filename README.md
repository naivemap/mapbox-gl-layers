# mapbox-gl-layers

[全国主要城市空气质量 - 百度地图](https://huanglii.github.io/mapbox-gl-js-cookbook/example/echarts-scatter.html)

```bash
npm i @naivemap/mapbox-gl-layers
```

```js
import { EChartsLayer } from '@naivemap/mapbox-gl-layers'

// echart option
const option = {...}
const layer = new EChartsLayer('layer-id', option)

map.addLayer(layer)
```
