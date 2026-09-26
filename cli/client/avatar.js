// @ts-check
/**
 * Avatars: the image covers the fallback once it loads. This script hides an
 * image that fails to load, so the fallback shows, and hides the fallback of
 * a loaded image from assistive technology and layout, like Base UI.
 */

const IMAGE = "img[data-avatar-image]"

/** @param {HTMLImageElement} image */
function settle(image) {
  const root = image.closest("[data-avatar]")
  const loaded = image.complete && image.naturalWidth > 0
  image.hidden = !loaded
  for (const fallback of root?.querySelectorAll("[data-avatar-fallback]") ??
    []) {
    if (fallback instanceof HTMLElement) fallback.hidden = loaded
  }
}

// `load` and `error` do not bubble, so they are captured.
for (const type of ["load", "error"]) {
  document.addEventListener(
    type,
    (event) => {
      const target = event.target
      if (target instanceof HTMLImageElement && target.matches(IMAGE)) {
        settle(target)
      }
    },
    true
  )
}

// Images that finished before the script ran.
for (const image of document.querySelectorAll(IMAGE)) {
  if (image instanceof HTMLImageElement && image.complete) settle(image)
}

// A module: its declarations stay local.
export {}
