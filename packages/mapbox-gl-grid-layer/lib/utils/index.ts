import type { ColorOption, Metadata } from '../GridLayer'
import ColorRamp from '../ColorRamp'

/**
 * 检查 ColorOption
 * @param option
 * @returns
 */
export function checkColorOption(option: ColorOption) {
  const { type, values, colors } = option
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

  const imageData: number[] = []
  const colorRamp = new ColorRamp(colorOptions)

  for (let i = 0; i < nrows; i++) {
    for (let j = 0; j < ncols; j++) {
      const value = data[i][j]
      const color = value != nodata_value ? colorRamp.pick(value) : [0, 0, 0, 0]
      imageData.push(color[0], color[1], color[2], color[3] * 255)
    }
  }
  return imageData
}
