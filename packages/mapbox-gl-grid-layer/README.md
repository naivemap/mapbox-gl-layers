## GridLayer class

```bash
npm i @naivemap/mapbox-gl-grid-layer proj4
```

<b>Signature:</b>

```typescript
export default class GridLayer implements mapboxgl.CustomLayerInterface
```

<b>Implements:</b> mapboxgl.CustomLayerInterface

## Constructors

| Constructor | Description |
| --- | --- |
| (constructor)(`id`: `string`, `option`: `GridOption`) | Constructs a new instance of the <code>GridLayer</code> class |

### Parameters

**id** `(string)` The ID of the layer.

**option** `(GridOption)` The option of the grid.

| Name | Description |
| --- | --- |
| **option.data** <br />(`GridData`) | The grid data. |
| **option.colorOptions** <br />(`ColorOptions`) | The color options used to render the grid. |
| **option.resampling** <br />(Optional `enum`. One of `"linear"`, `"nearest"`. Defaults to `"linear"`) | The resampling/interpolation method to use for overscaling, also known as texture magnification filter. ref: [raster-resampling](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#paint-raster-raster-resampling) |
| **option.opacity** <br />(Optional `number` between 0 and 1 inclusive. Defaults to 1. | The opacity at which the grid will be drawn. |
| **option.mask** <br />(`MaskProperty`) | The polygonal mask or multipolygonal mask for the grid. |

```ts
export type GridOption = {
  data: GridData
  colorOptions: ColorOptions
  resampling?: 'linear' | 'nearest'
  opacity?: number
  mask?: MaskProperty
}

export type GridData = {
  data: number[][]
  metadata: Metadata
}

export type Metadata = {
  ncols: number // Number of cell columns
  nrows: number // Number of cell rows
  cellsize: number // Cell size
  xll: number // X-coordinate of the origin (by center or lower left corner of the cell)
  yll: number // Y-coordinate of the origin (by center or lower left corner of the cell)
  lltype?: 'center' | 'corner' // Is the origin the center or corner of the cell. Defaults to 'center'
  nodata_value?: number // The input values to be NoData in the output raster。Defaults to -9999.。
  projection?: string // Projection with EPSG code. Defaults to `'EPSG:4326'`.
}

export type ColorOptions = {
  type: 'unique' | 'classified' | 'stretched' // 唯一值 | 分类 | 拉伸
  colors: (number[] | string)[]
  values: number[]
}

export type MaskProperty = {
  type?: 'in' | 'out' // Default is 'in'
  data: GeoJSON.Polygon | GeoJSON.MultiPolygon
}
```

### Methods

## Example

```ts
const gridLayer = new GridLayer('grid-layer', {
  data: {
    data: [
      [1, -2, 3, 5, 4],
      [2, -9999, 2, 2, 4],
      [3, 5, 1, 0, 0],
    ],
    metadata: {
      xll: 106,
      yll: 30,
      cellsize: 1,
      ncols: 5,
      nrows: 3,
    },
  },
  colorOptions: {
    type: 'classified',
    colors: ['#f00', '#0f0', '#00f', '#ff0'],
    values: [1, 2, 3],
  },
})

map.addLayer(gridLayer)
```
