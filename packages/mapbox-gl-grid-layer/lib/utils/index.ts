import type { ColorOption, Metadata } from '../GridLayer'
import { interpolateColor, toRGBA } from './color'

/**
 * 检查 ColorOptions
 * @param options
 * @returns
 */
export function checkColorOptions(options: ColorOption) {
  const { type, values, colors } = options
  if (type === 'classified') {
    if (values.length + 1 === colors.length) {
      return true
    } else {
      throw new Error(
        'The length of colors must be greater than the length of values by 1 when the type of ColorOptions is classified.'
      )
    }
  } else {
    if (values.length === colors.length) {
      return true
    } else {
      throw new Error('The length of colors must be equal to the length of values.')
    }
  }
}

/**
 * 获取 ImageData
 * @param data
 * @param metaData
 * @param colorOptions
 * @returns
 */
export function getImageData(data: number[][], metaData: Metadata, colorOptions: ColorOption) {
  const { ncols, nrows, nodata_value = -9999 } = metaData
  const { type, values, colors } = colorOptions

  const imageData: number[] = []
  for (let i = 0; i < nrows; i++) {
    for (let j = 0; j < ncols; j++) {
      let color: number[] = [0, 0, 0, 0]
      const value = data[i][j]
      if (value != nodata_value) {
        if (type === 'stretched') {
          // 拉伸
          color = interpolateColor(value, values, colors)
        } else if (type === 'classified') {
          for (let i = 0, len = values.length; i < len; i++) {
            if (value <= values[i]) {
              color = toRGBA(colors[i])
              break
            }
            if (i === len - 1) {
              color = toRGBA(colors[len])
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
