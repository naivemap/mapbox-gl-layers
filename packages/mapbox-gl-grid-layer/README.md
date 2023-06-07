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
| **option.data** <br />(`string`) | URL that points to an image. |
| **option.metaData** <br />(`string`) | URL that points to an image. |
| **option.projection** <br />(`string`) | Projection with EPSG code that points to the image. |
| **option.colorOptions** <br />(`Array<Array<number>>`) | Corners of image specified in longitude, latitude pairs: top left, top right, bottom right, bottom left. ref: [coordinates](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#image-coordinates) |
| **option.resampling** <br />(Optional `enum`. One of `"linear"`, `"nearest"`. Defaults to `"linear"`) | The resampling/interpolation method to use for overscaling, also known as texture magnification filter. ref: [raster-resampling](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#paint-raster-raster-resampling) |
| **option.opacity** <br />(Optional `number` between 0 and 1 inclusive. Defaults to 1. | The opacity at which the image will be drawn. |
| **option.mask** <br />(`MaskProperty`) | The polygonal mask or multipolygonal mask for the image. |

```ts
export type GridOption = {
  data: number[][]
  metaData: GridMetaData
  projection: string
  colorOptions: ColorOptions
  resampling?: 'linear' | 'nearest'
  opacity?: number
  mask?: MaskProperty
}

export type GridMetaData = {
  ncols: number // Number of cell columns
  nrows: number // Number of cell rows
  cellsize: number // Cell size
  xll: number // X-coordinate of the origin (by center or lower left corner of the cell)
  yll: number // Y-coordinate of the origin (by center or lower left corner of the cell)
  lltype?: 'center' | 'corner' // Is the origin the center or corner of the cell. Default is 'center'
  nodata_value?: number // The input values to be NoData in the output raster。Default is -9999.。
}

export type MaskProperty = {
  type?: 'in' | 'out' // Default is 'in'
  data: GeoJSON.Polygon | GeoJSON.MultiPolygon
}

export type ColorOptions = {
  type: 'unique' | 'classified' | 'stretched' // 唯一值 | 分类 | 拉伸
  colors: (number[] | string)[]
  values: number[]
}
```

### Methods

#### updateImage

Updates the URL, the projection, the coordinates, the opacity or the resampling of the image.

```ts
updateImage(option: {
  url?: string
  projection?: string
  coordinates?: Coordinates
  opacity?: number
  resampling?: 'linear' | 'nearest'
}): this
```

#### updateMask

Updates the mask property.

```ts
updateMask(mask: Partial<MaskProperty>): this
```

## Example

```ts
const layer = new GridLayer('layer-id', {
  url: '/4326.png',
  projection: 'EPSG:4326',
  resampling: 'nearest',
  coordinates: [
    [105.289838, 32.204171], // top-left
    [110.195632, 32.204171], // top-right
    [110.195632, 28.164713], // bottom-right
    [105.289838, 28.164713], // bottom-left
  ],
})

map.addLayer(layer)
```
