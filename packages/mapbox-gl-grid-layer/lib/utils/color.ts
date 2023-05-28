//@ts-ignore
import { parseCSSColor } from 'csscolorparser'

/**
 * CSS 颜色转 RGBA
 * @param colorString
 * @returns
 */
export function parseColor(colorString: string) {
  const rgba = parseCSSColor(colorString)
  if (!rgba) {
    return undefined
  }

  return [(rgba[0] / 255) * rgba[3], (rgba[1] / 255) * rgba[3], (rgba[2] / 255) * rgba[3], rgba[3]]
}

function getCurrentColor(value: number, values: number[], colors: any): [number, number[]] {
  for (let i = 0; i < values.length; i++) {
    if (value < values[i]) {
      return [values[i], toRGBA(colors[i])]
    }
  }
  return [value, toRGBA(colors[colors.length - 1])]
}

function getPreColor(value: number, values: number[], colors: any): [number, number[]] {
  for (let i = 0; i < values.length; i++) {
    if (value < values[i]) {
      return i === 0 ? [values[i], toRGBA(colors[i])] : [values[i - 1], toRGBA(colors[i - 1])]
    }
  }
  return [value, toRGBA(colors[colors.length - 1])]
}

function pickColor(color1: number[], color2: number[], weight: number, a: number) {
  if (color2[3] === 0) return color1
  const p = weight
  const w = p * 2 - 1
  const w1 = (w / 1 + 1) / 2
  const w2 = 1 - w1
  const r = Math.round(color1[0] * w1 + color2[0] * w2)
  const g = Math.round(color1[1] * w1 + color2[1] * w2)
  const b = Math.round(color1[2] * w1 + color2[2] * w2)

  return [r, g, b, a]
}

/**
 * 颜色插值
 * @param value
 * @param values
 * @param colors
 * @returns
 */
function interpolateColor(value: number, values: number[], colors: any) {
  const [realVal, realCol] = getCurrentColor(value, values, colors)
  const [preVal, preCol] = getPreColor(value, values, colors)

  if (realVal === preVal) {
    return realCol
  }
  const weight = (value - preVal) / (realVal - preVal)

  return pickColor(realCol, preCol, weight, realCol[3])
}

/**
 * hex 转 rgba
 * @param bgColor
 * @returns
 */
const hexToRgba = (hex: string, alpha = 1) => {
  const color = hex.slice(1) // 去掉'#'号
  const rgba = [
    parseInt('0x' + color.slice(0, 2)),
    parseInt('0x' + color.slice(2, 4)),
    parseInt('0x' + color.slice(4, 6)),
    alpha,
  ]

  return rgba
}

/**
 * toRGBA
 * @param {Color} color
 * @returns [r, g, b, a]
 */
function toRGBA(color: any) {
  if ('string' === typeof color) {
    const parsedColor = parseCSSColor(color)

    if (parsedColor) {
      return parsedColor
    } else {
      throw new Error(`Invalide color: "${color}"`)
    }
  }
  return color
}

export { interpolateColor, toRGBA }
