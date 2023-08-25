//@ts-ignore
import { parseCSSColor } from 'csscolorparser'
import { ColorOption } from './GridLayer'

export type RGBA = [number, number, number, number]
export type Color = [number, number, number, number] | string
export type ColorType = 'unique' | 'classified' | 'stretched' // 唯一值 | 分类 | 拉伸

export default class ColorRamp {
  type: ColorType
  values: number[]
  colors: RGBA[]

  constructor(option: ColorOption) {
    this.type = option.type
    this.values = option.values
    this.colors = option.colors.map((item) => this.toRGBA(item))
  }

  pick(value: number) {
    const { type, values, colors } = this
    let color: number[] = [0, 0, 0, 0]

    if (type === 'unique') {
      // 唯一值
      if (values.indexOf(value) > -1) {
        color = colors[values.indexOf(value)]
      }
    } else if (type === 'classified') {
      for (let i = 0, len = values.length; i < len; i++) {
        if (value <= values[i]) {
          color = colors[i]
          break
        }
        if (i === len - 1) {
          color = colors[len]
        }
      }
    } else if (type === 'stretched') {
      // 拉伸
      color = this.interpolateColor(value, values, colors)
    }
    return color
  }

  private toRGBA(color: Color): RGBA {
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

  private getCurrentColor(value: number, values: number[], colors: any): [number, number[]] {
    for (let i = 0; i < values.length; i++) {
      if (value < values[i]) {
        return [values[i], colors[i]]
      }
    }
    return [value, colors[colors.length - 1]]
  }

  private getPreColor(value: number, values: number[], colors: any): [number, number[]] {
    for (let i = 0; i < values.length; i++) {
      if (value < values[i]) {
        return i === 0 ? [values[i], colors[i]] : [values[i - 1], colors[i - 1]]
      }
    }
    return [value, colors[colors.length - 1]]
  }

  private pickColor(color1: number[], color2: number[], weight: number, a: number) {
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

  private interpolateColor(value: number, values: number[], colors: any) {
    const [realVal, realCol] = this.getCurrentColor(value, values, colors)
    const [preVal, preCol] = this.getPreColor(value, values, colors)

    if (realVal === preVal) {
      return realCol
    }
    const weight = (value - preVal) / (realVal - preVal)

    return this.pickColor(realCol, preCol, weight, realCol[3])
  }
}
