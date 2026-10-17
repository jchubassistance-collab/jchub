export function parseDelimitedText(input: string, delimiter: string): string[][] {
  if (delimiter.length !== 1) throw new Error('Le séparateur doit être un caractère.');

  const text = input.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === delimiter) {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      if (character === '\r' && text[index + 1] === '\n') index += 1;
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('Le fichier CSV contient un champ entre guillemets incomplet.');
  if (field.length || row.length || (text.length > 0 && !/[\r\n]$/.test(text))) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function toCsvCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();

  let text: string;
  if (typeof value === 'object') {
    const cell = value as { result?: unknown; text?: unknown; richText?: unknown };
    if ('result' in cell) return toCsvCellValue(cell.result);
    if (typeof cell.text === 'string') text = cell.text;
    else if (Array.isArray(cell.richText)) {
      text = cell.richText.map((part) => {
        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') return part.text;
        return '';
      }).join('');
    } else {
      text = String(value);
    }
  } else {
    text = String(value);
  }

  return /^[\u0000-\u0020]*[=+\-@]/.test(text) ? `'${text}` : text;
}

export function stringifyCsvRows(rows: string[][]): string {
  return rows.map((row) => row.map((value) => (
    /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  )).join(',')).join('\n');
}
