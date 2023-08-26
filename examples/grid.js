import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import GridLayer, { BOUNDS_TYPE } from '../packages/mapbox-gl-grid-layer/lib'

mapboxgl.accessToken =
  'pk.eyJ1IjoiaHVhbmdsaWkiLCJhIjoiY2wwM2E4a2drMDVrZjNrcGRucHIxOHo0cyJ9.0ecG5KGQE6R-SmhxvLvhHg'
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/huanglii/ckqt08oxg1kcc18ub9vowurqd?optimize=true',
  hash: true,
  center: [108, 31],
  zoom: 6.5,
  fitBoundsOptions: {
    padding: { top: 10, bottom: 10, left: 10, right: 10 },
  },
})

map.on('load', () => {
  const data = [
    [1.01, -2, 3, 5, 4],
    [2, 0, 2, 2, 4],
    [3, 5, 1, 0, 1],
  ]
  const metadata = {
    xll: 106,
    yll: 30,
    cellsize: 1,
    ncols: 5,
    nrows: 3,
  }

  const gridLayer = new GridLayer('grid-layer', {
    data: {
      data,
      metadata,
    },
    colorOption: {
      type: 'stretched',
      boundsType: BOUNDS_TYPE.INCLUDE_MAX,
      colors: ['#f00', '#0f0', '#00f', '#ff0', '#0ff'],
      values: [0, 1, 2, 3, 4],
    },
  })

  map.addLayer(gridLayer, 'admin-1-boundary-bg')

  const features = []
  for (let i = 0; i < metadata.nrows; i++) {
    for (let j = 0; j < metadata.ncols; j++) {
      const lon = metadata.xll + j * metadata.cellsize
      const lat = metadata.yll + (metadata.nrows - 1 - i) * metadata.cellsize
      features.push({
        type: 'Feature',
        properties: { value: data[i][j] },
        geometry: {
          coordinates: [lon, lat],
          type: 'Point',
        },
      })
    }
  }
  map.addLayer({
    id: 'point',
    type: 'symbol',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    },
    layout: {
      'text-field': '{value}',
    },
    paint: {
      'text-halo-width': 1,
      'text-halo-color': '#fff',
    },
  })
})
