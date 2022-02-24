import * as echarts from 'echarts/core'

export default class CoordSystem {
  map: mapboxgl.Map
  dimensions = ['x', 'y']
  private mapOffset = [0, 0]

  constructor(map: mapboxgl.Map) {
    this.map = map
  }

  create(ecModel: any) {
    ecModel.eachSeries((seriesModel: any) => {
      if (seriesModel.get('coordinateSystem') === 'mapboxgl') {
        seriesModel.coordinateSystem = new CoordSystem(this.map)
      }
    })
  }

  setMapOffset(mapOffset: number[]) {
    this.mapOffset = mapOffset
  }

  dataToPoint(data: [number, number]) {
    const px = this.map.project(data)
    const mapOffset = this.mapOffset

    return [px.x - mapOffset[0], px.y - mapOffset[1]]
  }

  pointToData(pt: [number, number]) {
    const mapOffset = this.mapOffset
    const data = this.map.unproject([pt[0] + mapOffset[0], pt[1] + mapOffset[1]])
    return [data.lng, data.lat]
  }

  getViewRect() {
    const canvas = this.map.getCanvas()
    return new echarts.graphic.BoundingRect(0, 0, canvas.width, canvas.height)
  }

  getRoamTransform() {
    return echarts.matrix.create()
  }

  getDimensionsInfo() {
    return this.dimensions
  }
}
