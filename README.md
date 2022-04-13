# mapbox-gl-layers

## EChartsLayer

[全国主要城市空气质量 - 百度地图](https://huanglii.github.io/mapbox-gl-js-cookbook/example/echarts-scatter.html)

```bash
npm i @naivemap/mapbox-gl-layers echarts
```

```js
import { EChartsLayer } from '@naivemap/mapbox-gl-layers'

// echart option
const option = {...}
const layer = new EChartsLayer('layer-id', option)

map.addLayer(layer)
```

## ImageLayer

[图片](https://huanglii.github.io/mapbox-gl-js-cookbook/example/data-image-4326.html)

```bash
npm i @naivemap/mapbox-gl-layers proj4
```

```js
import { EChartsLayer } from '@naivemap/mapbox-gl-layers'

const layer4326 = new ImageLayer('layer-4326', {
  url: '/4326.png',
  projection: 'EPSG:4326',
  // 重采样 同: https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#paint-raster-raster-resampling
  // resampling: 'nearest',
  coordinates: [
    [105.289838, 32.204171], // top-left
    [110.195632, 32.204171], // top-right
    [110.195632, 28.164713], // bottom-right
    [105.289838, 28.164713], // bottom-left
  ],
})

map.addLayer(layer27700, 'aeroway-line')
```
