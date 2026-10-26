/** Interactive components a catalog entry can reference through its `component` field. */
export const TOOL_COMPONENTS = [
  'PasswordGenerator',
  'JsonFormatter',
  'Base64Tool',
  'UuidGenerator',
  'RegexTester',
  'PdfToWord',
  'PdfCompressor',
  'ExcelToCsvTool',
  'CsvToExcelTool',
  'WordToPdf',
  'ImagesToPdf',
  'ImageOptimizer',
  'SocialImageCropper',
  'ColorConverter',
  'HashGenerator',
  'JwtDecoder',
  'MarkdownPreview',
  'NumberBaseConverter',
  'QrCodeGenerator',
  'TimestampConverter',
  'UrlEncoder',
  'PdfMergeSplit',
  'LogoStudio',
  // @generated-tools: components created from the admin are inserted above this line.
] as const;

export type ToolComponentName = (typeof TOOL_COMPONENTS)[number];

export function isToolComponentName(value: string): value is ToolComponentName {
  return (TOOL_COMPONENTS as readonly string[]).includes(value);
}

/**
 * Tools that upload the visitor's file to /api/tools/* instead of working in the browser.
 * `partner` names the third party that also receives the file, for the privacy notice.
 */
export const SERVER_PROCESSED_TOOLS: Partial<Record<ToolComponentName, { partner?: string }>> = {
  PdfToWord: { partner: 'Adobe PDF Services' },
  WordToPdf: { partner: 'Adobe PDF Services' },
  PdfCompressor: {},
  ExcelToCsvTool: {},
  CsvToExcelTool: {},
  ImagesToPdf: {},
  ImageOptimizer: {},
};
