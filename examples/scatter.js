import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { EChartsLayer } from '../dist/mapbox-gl-layers.es'

mapboxgl.accessToken =
  'pk.eyJ1IjoiaHVhbmdsaWkiLCJhIjoiY2wwM2E4a2drMDVrZjNrcGRucHIxOHo0cyJ9.0ecG5KGQE6R-SmhxvLvhHg'
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/huanglii/ckqt08oxg1kcc18ub9vowurqd?optimize=true',
  bounds: [
    [105.289838, 32.204171],
    [110.195632, 28.164713],
  ],
  fitBoundsOptions: {
    padding: { top: 10, bottom: 10, left: 10, right: 10 },
  },
})

map.on('load', () => {
  // POINT(106.547764 29.565907)
  const data = [
    { name: '涪陵区', loc: [107.384728, 29.705364] },
    { name: '渝中区', loc: [106.565204, 29.555761] },
    { name: '沙坪坝区', loc: [106.452283, 29.543723] },
    { name: '南岸区', loc: [106.641061, 29.503544] },
    { name: '北碚区', loc: [106.391793, 29.807495] },
    { name: '綦江区', loc: [106.64761, 29.031223] },
    { name: '大足区', loc: [105.71809, 29.709322] },
    { name: '渝北区', loc: [106.627442, 29.720893] },
    { name: '巴南区', loc: [106.53688, 29.405196] },
    { name: '黔江区', loc: [108.766614, 29.536555] },
    { name: '长寿区', loc: [107.076865, 29.860372] },
    { name: '江津区', loc: [106.255498, 29.292994] },
    { name: '合川区', loc: [106.272908, 29.975394] },
    { name: '永川区', loc: [105.923646, 29.359118] },
    { name: '南川区', loc: [107.094714, 29.160315] },
    { name: '璧山区', loc: [106.223599, 29.594697] },
    { name: '铜梁区', loc: [106.052475, 29.84725] },
    { name: '潼南区', loc: [105.836863, 30.194192] },
    { name: '荣昌区', loc: [105.590602, 29.407506] },
    { name: '开州区', loc: [108.388356, 31.163047] },
    { name: '梁平区', loc: [107.76527, 30.656713] },
    { name: '城口县', loc: [108.660037, 31.949894] },
    { name: '丰都县', loc: [107.726387, 29.866134] },
    { name: '垫江县', loc: [107.328478, 30.329991] },
    { name: '忠县', loc: [108.033505, 30.302183] },
    { name: '云阳县', loc: [108.692762, 30.932934] },
    { name: '万州区', loc: [108.403998, 30.809981] },
    { name: '奉节县', loc: [109.459151, 31.020697] },
    { name: '巫山县', loc: [109.874449, 31.077103] },
    { name: '巫溪县', loc: [109.565328, 31.400913] },
    { name: '石柱土家族自治县', loc: [108.109488, 30.002104] },
    { name: '秀山土家族苗族自治县', loc: [109.002577, 28.451425] },
    { name: '酉阳土家族苗族自治县', loc: [108.763496, 28.844468] },
    { name: '彭水苗族土家族自治县', loc: [108.161257, 29.297059] },
    { name: '万盛区', loc: [106.934677, 28.971242] },
    { name: '武隆区', loc: [107.755067, 29.32831] },
  ]
  const convertData = (data) => {
    const res = []
    for (let i = 0; i < data.length; i++) {
      res.push({
        name: data[i].name,
        value: data[i].loc,
      })
    }
    return res
  }
  const option = {
    tooltip: {
      trigger: 'item',
    },
    series: [
      {
        name: 'pm2.5',
        type: 'effectScatter',
        data: convertData(data),
        symbolSize: 20,
        label: {
          formatter: '{a}',
          position: 'right',
          show: false,
        },
        emphasis: {
          label: {
            show: true,
          },
        },
      },
    ],
  }

  const layer = new EChartsLayer('layer-id', option)
  map.addLayer(layer)
})
