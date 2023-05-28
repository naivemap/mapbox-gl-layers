/**
 * 数据缩放并插值
 * @param w 目标矩阵宽度
 * @param h 目标矩阵高度
 * @param data 源数据矩阵（二维数组）
 * @param type 插值方式，1：双线性插值，2：三次内插法插值
 */
export const interpolation = (w: number, h: number, data: number[][], type = 2): number[][] => {
  const resData = new Array<number[]>(h)

  for (let j = 0; j < h; j++) {
    const line = new Array(w)
    for (let i = 0; i < w; i++) {
      let v
      if (type === 2) {
        v = cubicInterpolation(w, h, i, j, data)
      } else if (type === 1) {
        v = bilinearInterpolation(w, h, i, j, data)
      } else {
        throw new Error('scale data, type not supported(type must be 1 or 2)')
      }
      line[i] = Math.round(v)
    }
    resData[j] = line
  }

  return resData
}

/**
 * 双线性插值
 * @param sw 目标矩阵的宽度
 * @param sh 目标矩阵的高度
 * @param _x 目标矩阵中的x坐标
 * @param _y 目标矩阵中的y坐标
 * @param data 源数据矩阵（二维数组）
 */
export const bilinearInterpolation = (
  sw: number,
  sh: number,
  _x: number,
  _y: number,
  data: number[][]
): number => {
  const w = data[0].length
  const h = data.length

  const x = ((_x + 0.5) * w) / sw - 0.5
  const y = ((_y + 0.5) * h) / sh - 0.5

  let x1 = Math.floor(x)
  let x2 = Math.floor(x + 0.5)
  let y1 = Math.floor(y)
  let y2 = Math.floor(y + 0.5)

  x1 = x1 < 0 ? 0 : x1
  y1 = y1 < 0 ? 0 : y1

  x1 = x1 < w - 1 ? x1 : w - 1
  y1 = y1 < h - 1 ? y1 : h - 1

  x2 = x2 < w - 1 ? x2 : w - 1
  y2 = y2 < h - 1 ? y2 : h - 1

  // 取出原矩阵中对应四个点的值
  const f11 = data[y1][x1]
  const f21 = data[y1][x2]
  const f12 = data[y2][x1]
  const f22 = data[y2][x2]
  // 计算该点的值
  const xm = x - x1
  const ym = y - y1
  const r1 = (1 - xm) * f11 + xm * f21
  const r2 = (1 - xm) * f12 + xm * f22
  const value = (1 - ym) * r1 + ym * r2

  return value
}

/**
 * 三次内插法插值
 * @param sw 目标矩阵的宽度
 * @param sh 目标矩阵的高度
 * @param _x 目标矩阵中的x坐标
 * @param _y 目标矩阵中的y坐标
 * @param data 源数据矩阵（二维数组）
 */
export const cubicInterpolation = (
  sw: number,
  sh: number,
  _x: number,
  _y: number,
  data: number[][]
): number => {
  const w = data[0].length
  const h = data.length
  // 计算缩放后坐标对应源数据上的坐标
  const x = (_x * w) / sw
  const y = (_y * h) / sh

  // 计算x和y方向的最近的4*4的坐标和权重
  const wcx = getCubicWeight(x)
  const wcy = getCubicWeight(y)

  // 权重
  const wx = wcx.weight
  const wy = wcy.weight

  // 坐标
  const xs = wcx.coordinate
  const ys = wcy.coordinate

  let val = 0
  for (let j = 0; j < 4; j++) {
    let py = ys[j]
    py = py < 0 ? 0 : py
    py = py > h - 1 ? h - 1 : py
    for (let i = 0; i < 4; i++) {
      let px = xs[i]
      px = px < 0 ? 0 : px
      px = px > w - 1 ? w - 1 : px
      // 该点的值
      const dv = data[py][px]
      // 该点的权重
      const w_x = wx[i]
      const w_y = wy[j]
      // 根据加权加起来
      val += dv * w_x * w_y
    }
  }

  return val
}

/**
 * 三次内插法插值中，基于BiCubic基函数，计算源坐标v，最近的4*4的坐标和坐标对应的权重
 * @param v 目标矩阵中坐标对应在源矩阵中坐标值
 */
export const getCubicWeight = (v: number) => {
  const a = -0.5

  // 取整
  const nv = Math.floor(v)

  // 坐标差值集合
  const xList = new Array<number>(4)
  // 坐标集合
  const xs = new Array<number>(4)

  // 最近的4个坐标差值
  xList[0] = nv - v - 1
  xList[1] = nv - v
  xList[2] = nv - v + 1
  xList[3] = nv - v + 2
  //
  xs[0] = nv - 1
  xs[1] = nv
  xs[2] = nv + 1
  xs[3] = nv + 2

  // 计算权重
  const ws = new Array<number>(4)
  for (let i = 0; i < 4; i++) {
    const val = Math.abs(xList[i])
    let w = 0
    // 基于BiCubic基函数的双三次插值
    if (val <= 1) {
      w = (a + 2) * val * val * val - (a + 3) * val * val + 1
    } else if (val < 2) {
      w = a * val * val * val - 5 * a * val * val + 8 * a * val - 4 * a
    }
    ws[i] = w
  }

  return {
    weight: ws,
    coordinate: xs,
  }
}
