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

map.on('load', () => {
  const gridLayer = new GridLayer('grid-layer', {
    data: [
      [1, -2, 3, 5, 4],
      [2, -9999, 2, 2, 4],
      [3, 5, 1, 0, 0],
    ],
    projection: 'EPSG:4326',
    metaData: {
      xll: 106,
      yll: 30,
      cellsize: 1,
      ncols: 5,
      nrows: 3,
      // nodata_value: 9,
      // lltype: 'corner'
    },
    colorOptions: {
      type: 'classified',
      colors: ['#f00', '#0f0', '#00f', '#ff0'],
      values: [1, 2, 3],
    },
  })

  map.addLayer(gridLayer, 'aeroway-line')
})
