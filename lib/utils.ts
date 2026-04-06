import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { webcrypto } from "node:crypto"
const crypto = webcrypto as unknown as Crypto;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateCertId(prefix: string = "TC"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function calculateCertHash(data: any): Promise<string> {
  const str = JSON.stringify(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
