[Home](./index.md) &gt; [ImageLayer](./imagelayer.md)

## ImageLayer class

<b>Signature:</b>

```typescript
export default class ImageLayer implements mapboxgl.CustomLayerInterface 
```
<b>Implements:</b> mapboxgl.CustomLayerInterface

## Constructors

|  Constructor | Description |
|  --- | --- |
|  (constructor)(`id`: `string`, `option`: `ImageOption`) | Constructs a new instance of the <code>ImageLayer</code> class |

### Parameters
**id** `(string)` The ID of the layer.

**option** `(ImageOption)` The option of the image.

|  Name | Description |
|  --- | --- |
|  **option.url** <br />`(string)` | URL that points to an image.  |
|  **option.projection** <br />`(string)` | Projection with EPSG code that points to the image.  |
|  **option.resampling** <br />(Optional `enum`. One of `"linear"`, `"nearest"`. Defaults to `"linear"`) | The resampling/interpolation method to use for overscaling, also known as texture magnification filter. ref: [raster-resampling](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#paint-raster-raster-resampling)  |
|  **option.coordinates** <br />`(Array<Array<number>>)` | Corners of image specified in longitude, latitude pairs: top left, top right, bottom right, bottom left. ref: [coordinates](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#image-coordinates)  |

```ts
export type ImageOption = {
  url: string
  projection: string
  coordinates: Coordinates
  resampling: 'linear' | 'nearest'
}
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
