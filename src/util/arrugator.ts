import Arrugator from 'arrugator'
import proj4 from 'proj4'

/**
 * 初始化 Arrugator
 * https://gitlab.com/IvanSanchez/arrugator
 * @param fromProj
 * @param toProj
 * @param verts
 * @returns
 */
export function initArrugator(
  fromProj: string,
  toProj: string,
  verts: [number, number][]
): Arrugado {
  // 墨卡托投影的左上角坐标，对应 mapbox 左上角起始坐标 [0,0]
  const origin = [-20037508.342789244, 20037508.342789244]
  // 定义转换规则
  const projector = proj4(fromProj, toProj).forward
  // 改写坐标转换函数
  // 原因是 mapbox 的墨卡托坐标是 0-1，并且对应地理范围与标准 3857 不同
  function forward(coors: [number, number]) {
    // 墨卡托坐标
    const coor_3857 = projector(coors)
    // 墨卡托坐标转换到 0-1 区间，origin 对应mapbox 0 0点
    const mapbox_coor1 = Math.abs((coor_3857[0] - origin[0]) / (20037508.342789244 * 2))
    const mapbox_coor2 = Math.abs((coor_3857[1] - origin[1]) / (20037508.342789244 * 2))
    return [mapbox_coor1, mapbox_coor2]
  }
  const epsilon = 0.00000000001
  // 纹理uv坐标
  const sourceUV = [
    [0, 0], // top-left
    [0, 1], // bottom-left
    [1, 0], // top-right
    [1, 1], // bottom-right
  ]
  const arrugator = new Arrugator(forward, verts, sourceUV, [
    [0, 1, 3],
    [0, 3, 2],
  ])
  arrugator.lowerEpsilon(epsilon)
  // arrugado 里存了顶点，索引
  return arrugator.output()
}
