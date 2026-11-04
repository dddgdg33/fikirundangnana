/**
 * Centralized error message handling for consistent UX across the application
 */

export interface SupabaseError {
  code?: string
  message?: string
}

/**
 * Convert Supabase/PostgreSQL error codes to user-friendly messages
 */
export function getSupabaseErrorMessage(error: SupabaseError): string {
  // PostgreSQL error codes
  if (error.code === '23505') return 'Data duplikat. Gunakan nilai yang berbeda.'
  if (error.code === '23503') return 'Data terkait tidak ditemukan. Refresh halaman dan coba lagi.'
  if (error.code === '42501') return 'Akses ditolak. Login kembali sebagai admin.'
  if (error.code === '42P01') return 'Tabel tidak ditemukan. Hubungi administrator.'
  
  // PostgREST error codes
  if (error.code === 'PGRST301') return 'Tidak ada akses. Cek permissions atau login kembali.'
  if (error.code === 'PGRST116') return 'Data tidak ditemukan.'
  if (error.code === 'PGRST204') return 'Data tidak tersedia.'
  
  // Return original message if available, otherwise generic error
  return error.message || 'Terjadi kesalahan. Silakan coba lagi.'
}

/**
 * Get user-friendly error messages for network/connection issues
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Koneksi jaringan terputus. Periksa internet Anda dan coba lagi.'
  }
  if (error instanceof Error && error.message.toLowerCase().includes('timeout')) {
    return 'Permintaan timeout. Coba lagi dalam beberapa saat.'
  }
  return 'Gagal terhubung ke server. Periksa koneksi internet Anda.'
}

/**
 * Get user-friendly error messages for file upload failures
 */
export interface UploadError {
  type?: string
  size?: number
  code?: string
}

export function getUploadErrorMessage(error: UploadError | Error | unknown): string {
  // Type validation errors
  if (error && typeof error === 'object' && 'type' in error) {
    return 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'
  }
  
  // Size validation errors  
  if (error && typeof error === 'object' && 'size' in error) {
    return 'Ukuran file terlalu besar. Maksimal 10 MB per file.'
  }
  
  // Storage errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as SupabaseError
    if (supabaseError.code === '413') return 'Ukuran file terlalu besar. Maksimal 10 MB.'
    if (supabaseError.code === '404') return 'Bucket storage tidak ditemukan. Hubungi administrator.'
    if (supabaseError.code === '403') return 'Akses upload ditolak. Login kembali sebagai admin.'
  }
  
  // Network errors
  if (error instanceof TypeError) {
    return getNetworkErrorMessage(error)
  }
  
  // Generic upload error
  if (error instanceof Error) {
    return error.message || 'Gagal mengunggah file. Coba lagi.'
  }
  
  return 'Gagal mengunggah file. Periksa ukuran dan format file.'
}

/**
 * Get user-friendly error messages for save operations
 */
export function getSaveErrorMessage(error: SupabaseError | Error | unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return getSupabaseErrorMessage(error as SupabaseError)
  }
  
  if (error instanceof TypeError) {
    return getNetworkErrorMessage(error)
  }
  
  if (error instanceof Error) {
    return error.message || 'Gagal menyimpan perubahan. Coba lagi.'
  }
  
  return 'Gagal menyimpan perubahan. Coba lagi.'
}

/**
 * Standard success message for save operations
 */
export const SUCCESS_MESSAGES = {
  saved: 'Perubahan berhasil disimpan.',
  created: 'Data berhasil dibuat.',
  deleted: 'Data berhasil dihapus.',
  uploaded: 'File berhasil diunggah.',
} as const

/**
 * Validation error messages
 */
export const VALIDATION_ERRORS = {
  required: 'Field ini wajib diisi.',
  emailInvalid: 'Format email tidak valid.',
  urlInvalid: 'Format URL tidak valid.',
  minLength: (min: number) => `Minimal ${min} karakter.`,
  maxLength: (max: number) => `Maksimal ${max} karakter.`,
  slugInvalid: 'Slug hanya boleh mengandung huruf kecil, angka, dan tanda hubung.',
} as const
