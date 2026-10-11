import { API_BASE_URL } from './config';
import { getStoredAuth } from './sessionStore';
import { ApiError } from './client';

// ── Response types ──────────────────────────────────────────────────────────

export interface ReceiptLineItem {
  name: string;
  price: number;
}

/** Structured data extracted from a receipt image by the backend OCR. */
export interface ReceiptScanResult {
  merchant: string | null;
  total: number | null;
  tax: number | null;
  taxId: string | null;
  /** "YYYY-MM-DD" or null if the date couldn't be read. */
  date: string | null;
  /** One of: Groceries, Fuel, Salary, Bills, Dining, Other. */
  category: string | null;
  items: ReceiptLineItem[];
  /** 0.0 – 1.0 — how confident the OCR is in its extraction. */
  confidence: number;
}

// ── API call ────────────────────────────────────────────────────────────────

/**
 * Uploads a receipt image to the backend for OCR processing.
 * The image is sent as multipart/form-data.
 */
export async function scanReceipt(imageUri: string): Promise<ReceiptScanResult> {
  const stored = getStoredAuth();
  if (!stored) {
    throw new ApiError(401, 'not_signed_in', 'Please log in again.');
  }

  if (!API_BASE_URL) {
    throw new ApiError(0, 'network', 'The app has no server address configured.');
  }

  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'receipt.jpg',
  } as any);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30s — OCR can be slow

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/receipts/scan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stored.session.accessToken}`,
        Accept: 'application/json',
        // Don't set Content-Type — FormData sets it with the multipart boundary
      },
      body: formData,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'network', "Can't reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.code ?? null,
      data?.error ?? data?.Error ?? data?.detail ?? data?.title ?? 'Receipt scan failed. Try again.',
    );
  }

  return data as ReceiptScanResult;
}
