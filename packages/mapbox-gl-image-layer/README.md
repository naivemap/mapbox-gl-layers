## ImageLayer class

```bash
npm i @naivemap/mapbox-gl-image-layer proj4
```

<b>Signature:</b>

```typescript
export default class ImageLayer implements mapboxgl.CustomLayerInterface
```

<b>Implements:</b> mapboxgl.CustomLayerInterface

## Constructors

| Constructor | Description |
| --- | --- |
| (constructor)(`id`: `string`, `option`: `ImageOption`) | Constructs a new instance of the <code>ImageLayer</code> class |

### Parameters

**id** `(string)` The ID of the layer.

**option** `(ImageOption)` The option of the image.

| Name | Description |
| --- | --- |
| **option.url** <br />(`string`) | URL that points to an image. |
| **option.projection** <br />(`string`) | Projection with EPSG code that points to the image. |
| **option.coordinates** <br />(`Array<Array<number>>`) | Corners of image specified in longitude, latitude pairs: top left, top right, bottom right, bottom left. ref: [coordinates](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#image-coordinates) |
| **option.resampling** <br />(Optional `enum`. One of `"linear"`, `"nearest"`. Defaults to `"linear"`) | The resampling/interpolation method to use for overscaling, also known as texture magnification filter. ref: [raster-resampling](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#paint-raster-raster-resampling) |
| **option.opacity** <br />(Optional `number` between 0 and 1 inclusive. Defaults to 1. | The opacity at which the image will be drawn. |
| **options.crossOrigin** <br />(`string`) | The crossOrigin attribute is a string which specifies the Cross-Origin Resource Sharing ([CORS](https://developer.mozilla.org/en-US/docs/Glossary/CORS)) setting to use when retrieving the image. |

```ts
export type ImageOption = {
  url: string
  projection: string
  coordinates: Coordinates
  resampling: 'linear' | 'nearest'
}
```

### Methods

#### updateImage

Updates the image URL and, optionally, the projection, the coordinates and the resampling.

```ts
updateImage(option: {
  url: string
  projection?: string
  coordinates?: Coordinates
  resampling?: 'linear' | 'nearest'
}): this
```

## Example

```ts
const layer = new ImageLayer('layer-id', {
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
