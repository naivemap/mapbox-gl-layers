import { ImageLayer } from '../src/index'
import proj4 from 'proj4'

mapboxgl.accessToken =
  'pk.eyJ1IjoiaHVhbmdsaWkiLCJhIjoiY2wwM2E4a2drMDVrZjNrcGRucHIxOHo0cyJ9.0ecG5KGQE6R-SmhxvLvhHg'
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/huanglii/ckqt08oxg1kcc18ub9vowurqd?optimize=true',
  hash: true,
  bounds: [
    [105.289838, 32.204171],
    [110.195632, 28.164713],
  ],
  fitBoundsOptions: {
    padding: { top: 10, bottom: 10, left: 10, right: 10 },
  },
})

map.on('load', () => {
  proj4.defs(
    'EPSG:27700',
    '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
    '+x_0=400000 +y_0=-100000 +ellps=airy ' +
    '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
    '+units=m +no_defs'
  )
  // const layer = new ImageLayer('layer-id', {
  //   url: '/2000px-British_National_Grid.svg.png',
  //   projection: 'EPSG:27700',
  //   coordinates: [
  //     [0, 1300000], // top-left
  //     [700000, 1300000], // top-right
  //     [700000, 0], // bottom-right
  //     [0, 0], // bottom-left
  //   ]
  // })

  const layer = new ImageLayer('layer-id', {
    url: '/4326.png',
    projection: 'EPSG:4326',
    // resampling: 'nearest',
    coordinates: [
      [105.289838, 32.204171], // top-left
      [110.195632, 32.204171], // top-right
      [110.195632, 28.164713], // bottom-right
      [105.289838, 28.164713], // bottom-left
    ]
  })

  map.addLayer(layer, 'aeroway-line')

  setTimeout(() => {
    map.removeLayer('layer-id')
  }, 2000);

  setTimeout(() => {
    map.addLayer(layer, 'aeroway-line')
  }, 3000);
})