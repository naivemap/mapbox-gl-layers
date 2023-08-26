import { RGBA } from './ColorRamp'

export default class StretchedColor {
  private colors: RGBA[]
  private domains: number[]
  private min: number
  private max: number

  constructor(colors: RGBA[], domains: number[]) {
    this.colors = colors
    this.domains = domains
    this.min = domains[0]
    this.max = domains[domains.length - 1]
  }

  pick(value: number): RGBA {
    const { domains, colors } = this

    if (value < this.min || value > this.max) {
      return [0, 0, 0, 0]
    } else if (domains.indexOf(value) > -1) {
      return colors[domains.indexOf(value)]
    } else {
      let prevValue = domains[0]
      let nextValue = domains[0]
      let prevColor = colors[0]
      let nextColor = colors[0]

      for (let i = 1, len = domains.length; i < len; i++) {
        if (value < domains[i]) {
          prevValue = domains[i - 1]
          nextValue = domains[i]
          prevColor = colors[i - 1]
          nextColor = colors[i]
          break
        }
      }

      const w1 = (value - prevValue) / (nextValue - prevValue)
      const w2 = 1 - w1
      const r = Math.round(nextColor[0] * w1 + prevColor[0] * w2)
      const g = Math.round(nextColor[1] * w1 + prevColor[1] * w2)
      const b = Math.round(nextColor[2] * w1 + prevColor[2] * w2)
      const a = nextColor[3] * w1 + prevColor[3] * w2

      return [r, g, b, a]
    }
  }
}
