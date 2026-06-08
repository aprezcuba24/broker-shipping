import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPriceCents(cents: number): string {
  return (cents / 100).toLocaleString('es', {
    style: 'currency',
    currency: 'USD',
  });
}

export function toPriceCents(price: number): number {
  return Math.round(price * 100)
}
