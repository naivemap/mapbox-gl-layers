# mapbox-gl-echarts-layer

[demo](https://huanglii.github.io/mapbox-gl-js-cookbook/example/echarts-scatter.html)

```bash
npm i @naivemap/mapbox-gl-echarts-layer
```

```js
import EchartsLayer from '@naivemap/mapbox-gl-echarts-layer'

// echart option
const option = {...}
const layer = new EchartsLayer('layer-id', option)

map.addLayer(layer)
```
