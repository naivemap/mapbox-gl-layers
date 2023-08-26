import { BOUNDS_TYPE, RGBA } from './ColorRamp'

export default class ColorClass {
  min: number
  max: number
  color: RGBA

  constructor(min: number, max: number, color: RGBA) {
    this.min = min
    this.max = max
    this.color = color
  }

  contains(val: number, type: BOUNDS_TYPE) {
    return (
      (val > this.min ||
        (!isNaN(this.min) &&
          val == this.min &&
          (type == BOUNDS_TYPE.INCLUDE_MIN_AND_MAX || type == BOUNDS_TYPE.INCLUDE_MIN)) ||
        isNaN(this.min)) &&
      (val < this.max ||
        (!isNaN(this.max) &&
          val == this.max &&
          (type == BOUNDS_TYPE.INCLUDE_MIN_AND_MAX || type == BOUNDS_TYPE.INCLUDE_MAX)) ||
        isNaN(this.max))
    )
  }
}
