/**
 * loadImage
 * @param src
 * @returns
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.src = src
    img.onload = function () {
      res(img)
    }
    img.onerror = function () {
      rej('error')
    }
  })
}
