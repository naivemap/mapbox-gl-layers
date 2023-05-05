/**
 * load image
 * @param src
 * @param crossOrigin
 * @returns
 */
export function loadImage(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()

    img.crossOrigin = crossOrigin ?? ''
    img.src = src
    img.onload = function () {
      res(img)
    }
    img.onerror = function () {
      rej('error')
    }
  })
}
