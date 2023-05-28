import { ColorOptions, GridDataOptions } from '..'
import { interpolateColor, toRGBA } from './color'
import { cubicInterpolation } from './interpolation'

export function getImageData(
  data: number[][],
  gridDataOptions: GridDataOptions,
  colorOptions: ColorOptions,
  scale = 1
) {
  const { xSize, ySize, noData } = gridDataOptions
  const { type, values, colors } = colorOptions

  const imageData: number[] = []
  const h = ySize * scale
  const w = xSize * scale
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      let color: number[] = [0, 0, 0, 0]
      const value = scale === 1 ? data[i][j] : cubicInterpolation(w, h, j, i, data)
      if (value != noData) {
        if (type === 'stretched') {
          // 拉伸
          color = interpolateColor(value, values, colors)
        } else if (type === 'classified') {
          for (let i = 0; i < values.length; i++) {
            if (value <= values[i]) {
              color = toRGBA(colors[i])
              break
            }
          }
        } else if (type === 'unique') {
          // 唯一值
          if (values.indexOf(value) > -1) {
            color = toRGBA(colors[values.indexOf(value)])
          }
        }
      }
      imageData.push(color[0], color[1], color[2], color[3] * 255)
    }
  }
  return imageData
}
