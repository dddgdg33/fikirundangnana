export interface CreateEventDraft {
  title: string
  slug: string
  bride_name: string
  groom_name: string
  template_id: string
}

export type CreateEventValidationErrors = Partial<Record<keyof CreateEventDraft, string>>

export function slugifyEventTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

export function getCreateEventValidationErrors(draft: CreateEventDraft): CreateEventValidationErrors {
  const errors: CreateEventValidationErrors = {}
  if (!draft.title.trim()) errors.title = 'Judul acara wajib diisi.'
  if (!draft.bride_name.trim()) errors.bride_name = 'Nama mempelai wanita wajib diisi.'
  if (!draft.groom_name.trim()) errors.groom_name = 'Nama mempelai pria wajib diisi.'
  if (!draft.template_id) errors.template_id = 'Pilih template undangan.'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {
    errors.slug = 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.'
  }
  return errors
}
