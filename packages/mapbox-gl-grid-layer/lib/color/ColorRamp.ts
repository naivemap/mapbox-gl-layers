import { ColorOption } from '../GridLayer'
import { toRGBA } from '../utils'
import ClassifiedColor, { BOUNDS_TYPE } from './ClassifiedColor'
import StretchedColor from './StretchedColor'

export type RGBA = [number, number, number, number]
export type Color = RGBA | string
export type ColorType = 'unique' | 'classified' | 'stretched' // 唯一值 | 分类 | 拉伸

export default class ColorRamp {
  type: ColorType
  values: number[]
  colors: RGBA[]
  boundsType: BOUNDS_TYPE
  classifiedColors?: ClassifiedColor[]
  stretchedColor?: StretchedColor

  constructor(option: ColorOption) {
    const { type, values, colors } = option
    this.type = type
    this.values = values
    this.colors = colors.map((item) => toRGBA(item))
    this.boundsType = option.boundsType ?? BOUNDS_TYPE.INCLUDE_MAX

    if (type === 'classified') {
      this.classifiedColors = this.colors.map((item, i) => {
        return new ClassifiedColor(values[i], values[i + 1], item)
      })
    } else if (type === 'stretched') {
      this.stretchedColor = new StretchedColor(this.colors, this.values)
    }
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
      // 分类
      for (let i = 0, len = colors.length; i < len; i++) {
        if (this.classifiedColors![i].contains(value, this.boundsType)) {
          color = this.classifiedColors![i].color
          break
        }
      }
    } else if (type === 'stretched') {
      // 拉伸
      color = this.stretchedColor!.pick(value)
    }
    return color
  }
}
