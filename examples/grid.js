import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import GridLayer from '../packages/mapbox-gl-grid-layer/lib'

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

map.on('click', (e) => {
  console.log(e.lngLat)
})

map.on('load', () => {
  const gridLayer = new GridLayer('grid-layer', {
    data: [
      [1, 2, 3],
      [3, 9, 1],
      [3, 2, 1],
    ],
    projection: 'EPSG:4326',
    gridDataOptions: {
      xStart: 110,
      xEnd: 112,
      xDelta: 1,
      xSize: 3,
      yStart: 32,
      yEnd: 30,
      yDelta: -3,
      ySize: 3,
      noData: 9,
    },
    colorOptions: {
      type: 'classified',
      colors: ['#f00', '#0f0', '#00f'],
      values: [1, 2, 3],
    },
  })

  map.addLayer(gridLayer, 'aeroway-line')
})
