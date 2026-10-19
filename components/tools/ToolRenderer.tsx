'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { ToolComponentName } from '@/lib/tool-components';

// One chunk per tool: a tool page downloads only the tool it shows, not all twenty.
// The dynamic imports live in a Client Component because Next.js does not code-split
// Client Components that a Server Component imports dynamically.
const tools: Record<ToolComponentName, ComponentType> = {
  PasswordGenerator: dynamic(() => import('@/components/tools/PasswordGenerator').then((m) => m.PasswordGenerator)),
  JsonFormatter: dynamic(() => import('@/components/tools/JsonFormatter').then((m) => m.JsonFormatter)),
  Base64Tool: dynamic(() => import('@/components/tools/Base64Tool').then((m) => m.Base64Tool)),
  UuidGenerator: dynamic(() => import('@/components/tools/UuidGenerator').then((m) => m.UuidGenerator)),
  RegexTester: dynamic(() => import('@/components/tools/RegexTester').then((m) => m.RegexTester)),
  PdfToWord: dynamic(() => import('@/components/tools/PdfToWord').then((m) => m.PdfToWord)),
  PdfCompressor: dynamic(() => import('@/components/tools/PdfCompressor').then((m) => m.PdfCompressor)),
  ExcelToCsvTool: dynamic(() => import('@/components/tools/ExcelToCsvTool').then((m) => m.ExcelToCsvTool)),
  CsvToExcelTool: dynamic(() => import('@/components/tools/CsvToExcelTool').then((m) => m.CsvToExcelTool)),
  WordToPdf: dynamic(() => import('@/components/tools/WordToPdf').then((m) => m.WordToPdf)),
  ImagesToPdf: dynamic(() => import('@/components/tools/ImagesToPdf').then((m) => m.ImagesToPdf)),
  ImageOptimizer: dynamic(() => import('@/components/tools/ImageOptimizer').then((m) => m.ImageOptimizer)),
  ColorConverter: dynamic(() => import('@/components/tools/jchub-tools/ColorConverter').then((m) => m.ColorConverter)),
  HashGenerator: dynamic(() => import('@/components/tools/jchub-tools/HashGenerator').then((m) => m.HashGenerator)),
  JwtDecoder: dynamic(() => import('@/components/tools/jchub-tools/JwtDecoder').then((m) => m.JwtDecoder)),
  MarkdownPreview: dynamic(() => import('@/components/tools/jchub-tools/MarkdownPreview').then((m) => m.MarkdownPreview)),
  NumberBaseConverter: dynamic(() => import('@/components/tools/jchub-tools/NumberBaseConverter').then((m) => m.NumberBaseConverter)),
  QrCodeGenerator: dynamic(() => import('@/components/tools/jchub-tools/QrCodeGenerator').then((m) => m.QrCodeGenerator)),
  TimestampConverter: dynamic(() => import('@/components/tools/jchub-tools/TimestampConverter').then((m) => m.TimestampConverter)),
  UrlEncoder: dynamic(() => import('@/components/tools/jchub-tools/UrlEncoder').then((m) => m.UrlEncoder)),
  PdfMergeSplit: dynamic(() => import('@/components/tools/PdfMergeSplit').then((m) => m.PdfMergeSplit)),
  LogoStudio: dynamic(() => import('@/components/tools/logo-studio/LogoStudio').then((m) => m.LogoStudio)),
  // @generated-tools: components created from the admin are inserted above this line.
};

export function ToolRenderer({ component }: { component: ToolComponentName }) {
  const Tool = tools[component];
  return <Tool />;
}
