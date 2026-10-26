/** Page layout of the Images to PDF tool: one image per page, every length in millimetres. */

/** Width and height of each page format in portrait. */
export const PAGE_FORMATS = { a4: [210, 297], letter: [215.9, 279.4] } as const;
export const MARGINS_MM = { none: 0, small: 10, large: 20 } as const;

export type PageSize = keyof typeof PAGE_FORMATS | 'image';
export type Orientation = 'portrait' | 'landscape';
export type Fit = 'contain' | 'cover';
export type Margin = keyof typeof MARGINS_MM;
export type LayoutOptions = { pageSize: PageSize; orientation: Orientation; fit: Fit; margin: Margin };

type Box = { x: number; y: number; width: number; height: number };

/** A page matched to the image shows it at 96 dpi, the size a browser gives it. */
const MM_PER_PIXEL = 25.4 / 96;

export function isPageSize(value: unknown): value is PageSize {
  return value === 'image' || Object.hasOwn(PAGE_FORMATS, String(value));
}

export function isMargin(value: unknown): value is Margin {
  return Object.hasOwn(MARGINS_MM, String(value));
}

/**
 * Page size, the frame inside the margins, and where the image goes. A page matched to the
 * image follows its proportions whatever the orientation, so the image is never distorted.
 * With `cover` the image overflows the frame and must be clipped to it.
 */
export function layoutImagePage(imageWidth: number, imageHeight: number, options: LayoutOptions): { page: { width: number; height: number }; frame: Box; image: Box } {
  const margin = MARGINS_MM[options.margin];
  if (options.pageSize === 'image') {
    const frame = { x: margin, y: margin, width: imageWidth * MM_PER_PIXEL, height: imageHeight * MM_PER_PIXEL };
    return { page: { width: frame.width + 2 * margin, height: frame.height + 2 * margin }, frame, image: { ...frame } };
  }

  const [short, long] = PAGE_FORMATS[options.pageSize];
  const page = options.orientation === 'portrait' ? { width: short, height: long } : { width: long, height: short };
  const frame = { x: margin, y: margin, width: page.width - 2 * margin, height: page.height - 2 * margin };
  const scale = (options.fit === 'contain' ? Math.min : Math.max)(frame.width / imageWidth, frame.height / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    page,
    frame,
    image: { x: frame.x + (frame.width - width) / 2, y: frame.y + (frame.height - height) / 2, width, height },
  };
}
