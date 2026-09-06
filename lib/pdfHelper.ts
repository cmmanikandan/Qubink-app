import { PDFDocument } from 'pdf-lib';

/**
 * Accurately extracts the total page count from a PDF file using pdf-lib.
 * Handles standard PDFs, linearized PDFs, and encrypted/protected PDFs.
 */
export async function detectPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const count = pdfDoc.getPageCount();
    if (count && count > 0) {
      return count;
    }
  } catch (err) {
    console.warn('pdf-lib count extraction error, trying fallback binary parser:', err);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder('latin1').decode(new Uint8Array(arrayBuffer));
      
      // Look for /Count in /Type /Pages
      const countMatches = text.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/) 
        || text.match(/\/Count\s+(\d+)[\s\S]*?\/Type\s*\/Pages/);
      if (countMatches && countMatches[1]) {
        const p = parseInt(countMatches[1], 10);
        if (p > 0) return p;
      }

      // Count occurrences of `/Type /Page` (excluding `/Type /Pages`)
      const matches = text.match(/\/Type\s*\/Page\b/g);
      if (matches && matches.length > 0) {
        return matches.length;
      }
    } catch (fallbackErr) {
      console.error('Fallback PDF page detection failed:', fallbackErr);
    }
  }

  // Fallback minimum 1 page
  return 1;
}

export interface PageRangeResult {
  count: number;
  isValid: boolean;
  error?: string;
  summaryText: string;
}

/**
 * Calculates the number of pages to be printed based on a page range string.
 * Supports: "1-10", "3", "1-5, 8, 11-15"
 */
export function parsePageRangeCount(
  rangeType: 'ALL' | 'CUSTOM' | undefined,
  rangeStr: string | undefined,
  totalPages: number
): PageRangeResult {
  const total = Math.max(1, totalPages);
  
  if (!rangeType || rangeType === 'ALL' || !rangeStr || !rangeStr.trim()) {
    return {
      count: total,
      isValid: true,
      summaryText: `All pages (${total} pgs)`,
    };
  }

  const clean = rangeStr.trim();
  const tokens = clean.split(/[,;\s]+/).filter(Boolean);
  const pageSet = new Set<number>();
  let hasError = false;
  let errorMsg = '';

  for (const token of tokens) {
    if (token.includes('-')) {
      const parts = token.split('-');
      if (parts.length !== 2) {
        hasError = true;
        errorMsg = `Invalid format in "${token}". Use e.g. 1-10`;
        break;
      }
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);

      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        hasError = true;
        errorMsg = `Invalid range "${token}". Start must be <= End`;
        break;
      }

      if (start > total) {
        hasError = true;
        errorMsg = `Page ${start} exceeds total document pages (${total})`;
        break;
      }

      const boundedStart = start;
      const boundedEnd = Math.min(end, total);
      for (let i = boundedStart; i <= boundedEnd; i++) {
        pageSet.add(i);
      }
    } else {
      const page = parseInt(token, 10);
      if (isNaN(page) || page < 1) {
        hasError = true;
        errorMsg = `Invalid page number "${token}"`;
        break;
      }
      if (page > total) {
        hasError = true;
        errorMsg = `Page ${page} exceeds total document pages (${total})`;
        break;
      }
      pageSet.add(page);
    }
  }

  if (hasError || pageSet.size === 0) {
    return {
      count: total,
      isValid: false,
      error: errorMsg || 'No valid pages found in range',
      summaryText: `All pages (${total} pgs)`,
    };
  }

  const count = pageSet.size;
  return {
    count,
    isValid: true,
    summaryText: `${count} of ${total} pages (Range: ${rangeStr.trim()})`,
  };
}
