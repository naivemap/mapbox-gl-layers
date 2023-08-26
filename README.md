# mapbox-gl-layers

Some implementations of mapbox's custom layer API.

## Installing

### EChartsLayer

```bash
npm i @naivemap/mapbox-gl-echarts-layer echarts
```

eg. [echarts-scatter](https://huanglii.github.io/mapbox-gl-js-cookbook/example/plugins-echarts-scatter.html)

### ImageLayer

```bash
npm i @naivemap/mapbox-gl-image-layer proj4
```

eg. [image-layer](https://huanglii.github.io/mapbox-gl-js-cookbook/example/plugins-image-layer.html)

### GridLayer

```bash
npm i @naivemap/mapbox-gl-grid-layer proj4
```

eg. [grid-layer](https://huanglii.github.io/mapbox-gl-js-cookbook/example/plugins-grid-layer.html)

## API Reference

| Class | Description |
| --- | --- |
| [EChartsLayer](./packages/mapbox-gl-echarts-layer/README.md) | Integrate the [Lines graph](https://echarts.apache.org/zh/option.html#series-lines) and [Scatter (bubble) chart](https://echarts.apache.org/zh/option.html#series-scatter) of [Apache ECharts](https://echarts.apache.org/zh/index.html). |
| [ImageLayer](./packages/mapbox-gl-image-layer/README.md) | Load a static image of any projection via [Arrugator](https://gitlab.com/IvanSanchez/arrugator) and [Proj4js](https://github.com/proj4js/proj4js). |
| [GridLayer](./packages/mapbox-gl-image-layer/README.md) | Render colorful grid data. |
