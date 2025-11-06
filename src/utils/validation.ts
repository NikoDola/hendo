export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price > 0 && isFinite(price);
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

export function sanitizeHashtags(hashtags: string[]): string[] {
  return hashtags
    .map(tag => tag.trim().toLowerCase().replace(/^#/, ''))
    .filter(tag => tag.length > 0);
}

export class ValidationError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export function validateTrackData(data: {
  title?: string;
  description?: string;
  price?: number;
  hashtags?: string[];
}): void {
  if (data.title !== undefined && !data.title.trim()) {
    throw new ValidationError('Title is required', 'title');
  }

  if (data.description !== undefined && !data.description.trim()) {
    throw new ValidationError('Description is required', 'description');
  }

  if (data.price !== undefined && !isValidPrice(data.price)) {
    throw new ValidationError('Price must be a positive number', 'price');
  }

  if (data.hashtags !== undefined && !Array.isArray(data.hashtags)) {
    throw new ValidationError('Hashtags must be an array', 'hashtags');
  }
}

