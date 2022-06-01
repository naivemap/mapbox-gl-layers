# mapbox-gl-layers

Some implementations of mapbox's custom layer API.

## Installing

### EChartsLayer

```bash
npm i @naivemap/mapbox-gl-echarts-layer echarts
```

eg. [全国主要城市空气质量 - 百度地图](https://huanglii.github.io/mapbox-gl-js-cookbook/example/echarts-scatter.html)

### ImageLayer

```bash
npm i @naivemap/mapbox-gl-image-layer proj4
```

eg. [Image of EPSG:4326](https://huanglii.github.io/mapbox-gl-js-cookbook/example/data-image-4326.html)

## API Reference

| Class | Description |
| --- | --- |
| [EChartsLayer](./packages/mapbox-gl-echarts-layer/README.md) | Integrate the [Lines graph](https://echarts.apache.org/zh/option.html#series-lines) and [Scatter (bubble) chart](https://echarts.apache.org/zh/option.html#series-scatter) of [Apache ECharts](https://echarts.apache.org/zh/index.html). |
| [ImageLayer](./packages/mapbox-gl-image-layer/README.md) | Load a static image of any projection via [Arrugator](https://gitlab.com/IvanSanchez/arrugator) and [Proj4js](https://github.com/proj4js/proj4js). |
