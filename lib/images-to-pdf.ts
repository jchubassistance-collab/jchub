/** Page layout of the Images to PDF tool: one image per page, every length in millimetres. */

/** Width and height of each page format in portrait. */
export const PAGE_FORMATS = { a4: [210, 297], letter: [215.9, 279.4] } as const;
export const MARGINS_MM = { none: 0, small: 10, large: 20 } as const;
export const ZOOM_RANGE = { min: 0.25, max: 4 } as const;
export const ROTATIONS = [0, 90, 180, 270] as const;

export type PageSize = keyof typeof PAGE_FORMATS | 'image';
export type Orientation = 'portrait' | 'landscape';
export type Fit = 'contain' | 'cover';
export type Margin = keyof typeof MARGINS_MM;
export type Rotation = (typeof ROTATIONS)[number];
export type LayoutOptions = { pageSize: PageSize; orientation: Orientation; fit: Fit; margin: Margin };
/**
 * What the preview changes on one image: a zoom on top of the fit, quarter turns clockwise, and
 * where the image sits in the frame, like CSS `object-position`: -1 lines up the left (top)
 * edges, 0 centres it, 1 lines up the right (bottom) edges, whether the image is smaller or
 * larger than the frame.
 */
export type Adjustment = { zoom: number; x: number; y: number; rotation: Rotation };

export type Box = { x: number; y: number; width: number; height: number };

export const DEFAULT_ADJUSTMENT: Adjustment = { zoom: 1, x: 0, y: 0, rotation: 0 };

/** A page matched to the image shows it at 96 dpi, the size a browser gives it. */
const MM_PER_PIXEL = 25.4 / 96;

export function isPageSize(value: unknown): value is PageSize {
  return value === 'image' || Object.hasOwn(PAGE_FORMATS, String(value));
}

export function isMargin(value: unknown): value is Margin {
  return Object.hasOwn(MARGINS_MM, String(value));
}

const isBetween = (value: unknown, min: number, max: number) => typeof value === 'number' && value >= min && value <= max;

export function isAdjustment(value: unknown): value is Adjustment {
  return Boolean(value) && typeof value === 'object'
    && isBetween((value as Adjustment).zoom, ZOOM_RANGE.min, ZOOM_RANGE.max)
    && isBetween((value as Adjustment).x, -1, 1)
    && isBetween((value as Adjustment).y, -1, 1)
    && (ROTATIONS as readonly unknown[]).includes((value as Adjustment).rotation);
}

/**
 * Page size, the frame inside the margins, and where the image goes, turned as asked. A page
 * matched to the image follows its proportions whatever the orientation, so the image is never
 * distorted. With `cover` or a zoom the image can overflow the frame and must be clipped to it.
 */
export function layoutImagePage(imageWidth: number, imageHeight: number, options: LayoutOptions, adjustment: Adjustment = DEFAULT_ADJUSTMENT): { page: { width: number; height: number }; frame: Box; image: Box } {
  const margin = MARGINS_MM[options.margin];
  const [turnedWidth, turnedHeight] = adjustment.rotation % 180 ? [imageHeight, imageWidth] : [imageWidth, imageHeight];
  let page: { width: number; height: number };
  let frame: Box;
  let scale: number;
  if (options.pageSize === 'image') {
    frame = { x: margin, y: margin, width: turnedWidth * MM_PER_PIXEL, height: turnedHeight * MM_PER_PIXEL };
    page = { width: frame.width + 2 * margin, height: frame.height + 2 * margin };
    scale = MM_PER_PIXEL;
  } else {
    const [short, long] = PAGE_FORMATS[options.pageSize];
    page = options.orientation === 'portrait' ? { width: short, height: long } : { width: long, height: short };
    frame = { x: margin, y: margin, width: page.width - 2 * margin, height: page.height - 2 * margin };
    scale = (options.fit === 'contain' ? Math.min : Math.max)(frame.width / turnedWidth, frame.height / turnedHeight);
  }

  const width = turnedWidth * scale * adjustment.zoom;
  const height = turnedHeight * scale * adjustment.zoom;
  return {
    page,
    frame,
    image: {
      x: frame.x + (frame.width - width) * (1 + adjustment.x) / 2,
      y: frame.y + (frame.height - height) * (1 + adjustment.y) / 2,
      width,
      height,
    },
  };
}

/**
 * Arguments of jsPDF `addImage` that draw the stored picture turned clockwise by `rotation` so
 * that it fills `box`. jsPDF turns the picture counterclockwise about its bottom-left corner,
 * so the corner it is given moves with the turn.
 */
export function pdfImagePlacement(box: Box, rotation: Rotation): Box & { angle: number } {
  switch (rotation) {
    case 90: return { x: box.x, y: box.y - box.width, width: box.height, height: box.width, angle: 270 };
    case 180: return { x: box.x + box.width, y: box.y - box.height, width: box.width, height: box.height, angle: 180 };
    case 270: return { x: box.x + box.width, y: box.y + box.height - box.width, width: box.height, height: box.width, angle: 90 };
    default: return { ...box, angle: 0 };
  }
}

/** Mirrored orientations keep only their turn: cameras do not produce them. */
const EXIF_TURNS: Record<number, Rotation> = { 3: 180, 4: 180, 5: 270, 6: 90, 7: 90, 8: 270 };

/**
 * Clockwise turn a JPEG's EXIF orientation asks for. Browsers and the server's decoder apply it,
 * but a PDF embeds the stored pixels as they are, so the turn has to be drawn.
 */
export function jpegExifRotation(bytes: Uint8Array): Rotation {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 0;
  // Metadata segments all come before the start of scan (0xffda).
  for (let offset = 2; offset + 4 <= view.byteLength;) {
    const marker = view.getUint16(offset);
    if (marker >>> 8 !== 0xff || marker === 0xffda) return 0;
    const end = offset + 2 + view.getUint16(offset + 2);
    // "Exif" followed by two zero bytes.
    if (marker === 0xffe1 && end >= offset + 10 && end <= view.byteLength && view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0) {
      return exifOrientationTurn(view, offset + 10, end);
    }
    offset = end;
  }
  return 0;
}

function exifOrientationTurn(view: DataView, tiff: number, end: number): Rotation {
  if (tiff + 8 > end) return 0;
  const order = view.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) return 0;
  const little = order === 0x4949;
  const ifd = tiff + view.getUint32(tiff + 4, little);
  if (ifd + 2 > end) return 0;
  for (let entry = ifd + 2, left = view.getUint16(ifd, little); left > 0 && entry + 12 <= end; entry += 12, left -= 1) {
    if (view.getUint16(entry, little) === 0x0112) return EXIF_TURNS[view.getUint16(entry + 8, little)] ?? 0;
  }
  return 0;
}
