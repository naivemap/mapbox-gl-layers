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
| **option.colorOption** <br />(`ColorOption`) | The color options used to render the grid. |
| **option.resampling** <br />(Optional `enum`. One of `"linear"`, `"nearest"`. Defaults to `"linear"`) | The resampling/interpolation method to use for overscaling, also known as texture magnification filter. ref: [raster-resampling](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#paint-raster-raster-resampling) |
| **option.opacity** <br />(Optional `number` between 0 and 1 inclusive. Defaults to 1. | The opacity at which the grid will be drawn. |
| **option.mask** <br />(`MaskProperty`) | The polygonal mask or multipolygonal mask for the grid. |

```ts
export type GridOption = {
  data: GridData
  colorOption: ColorOption
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

export type ColorOption = {
  type: ColorType
  colors: Color[]
  values: number[]
  boundsType?: BOUNDS_TYPE
}

export type MaskProperty = {
  type?: 'in' | 'out' // Default is 'in'
  data: GeoJSON.Polygon | GeoJSON.MultiPolygon
}

export type ColorType = 'unique' | 'classified' | 'stretched'
export type Color = [number, number, number, number] | string

export enum BOUNDS_TYPE {
  INCLUDE_MIN_AND_MAX, // min <= value <= max
  INCLUDE_MAX, // min < value <= max
  INCLUDE_MIN, // min <= value < max
  EXCLUSIVE, // min < value < max
}
```

### Methods

#### updateColorOption

Updates the colorOption.

```ts
updateColorOption(option: Partial<ColorOption>): this
```

#### updateMask

Updates the mask property.

```ts
updateMask(mask: Partial<MaskProperty>): this
```

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
  colorOption: {
    type: 'classified',
    colors: ['#f00', '#0f0', '#00f', '#ff0'],
    values: [1, 2, 3, 4, 5],
  },
})

map.addLayer(gridLayer)
```
