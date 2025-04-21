import proj4 from 'proj4'
import Arrugator from './Arrugator'

// top left, top right, bottom right, bottom left.
export type Coordinates = [[number, number], [number, number], [number, number], [number, number]]

export type ArrugadoFlat = {
  pos: number[]
  uv: number[]
  trigs: number[]
}

export function initArrugator(
  fromProj: string,
  coordinates: Coordinates,
  step = 100
): ArrugadoFlat {
  // 墨卡托投影的左上角坐标，对应 mapbox 左上角起始坐标 [0,0]
  const origin = [-20037508.342789244, 20037508.342789244]
  // 坐标转换为 Arrugator 坐标 top-left, top-left, top-left, top-left)
  const verts = [coordinates[0], coordinates[3], coordinates[1], coordinates[2]]
  // 转换为 EPSG:3857
  const projector = proj4(fromProj, 'EPSG:3857').forward
  // 改写坐标转换函数，因为 mapbox 的墨卡托坐标是 0-1，并且对应地理范围与标准 3857 不同
  function forward(coors: [number, number]): [number, number] {
    // 墨卡托坐标
    const coor_3857 = projector(coors)
    // 墨卡托坐标转换到 0-1 区间，origin 对应 mapbox 0 0点
    const mapbox_coor1 = Math.abs((coor_3857[0] - origin[0]) / (20037508.342789244 * 2))
    const mapbox_coor2 = Math.abs((coor_3857[1] - origin[1]) / (20037508.342789244 * 2))
    return [mapbox_coor1, mapbox_coor2]
  }
  // 纹理uv坐标
  const sourceUV: [number, number][] = [
    [0, 0], // top-left
    [0, 1], // bottom-left
    [1, 0], // top-right
    [1, 1], // bottom-right
  ]
  const arrugator = new Arrugator(forward, verts, sourceUV, [
    [0, 1, 3],
    [0, 3, 2],
  ])

  if (step > 0) {
    arrugator.force()
    for (let i = 0; i < step; i++) {
      arrugator.step()
    }
  }

  const arrugado = arrugator.output()

  return {
    pos: arrugado.projected.flat() as number[], // mapbox 墨卡托坐标
    uv: arrugado.uv.flat() as number[], // uv 纹理
    trigs: arrugado.trigs.flat() as number[], // 三角形索引
  }
}
