import test from 'node:test'
import assert from 'node:assert/strict'
import { getCreateEventValidationErrors, slugifyEventTitle } from '../src/utils/eventDraft.ts'

test('creates an ASCII-safe slug from an Indonesian event title', () => {
  assert.equal(slugifyEventTitle('Pernikahan Dita & Fajar'), 'pernikahan-dita-fajar')
  assert.equal(slugifyEventTitle('Pernikahan Nūr & Aisyah'), 'pernikahan-nur-aisyah')
})

test('rejects a create event form without template and couple names', () => {
  assert.deepEqual(getCreateEventValidationErrors({
    title: 'Acara',
    slug: 'acara',
    bride_name: '',
    groom_name: '',
    template_id: '',
  }), {
    bride_name: 'Nama mempelai wanita wajib diisi.',
    groom_name: 'Nama mempelai pria wajib diisi.',
    template_id: 'Pilih template undangan.',
  })
})

test('rejects malformed URL slugs', () => {
  assert.equal(getCreateEventValidationErrors({
    title: 'Acara',
    slug: 'Acara Saya!',
    bride_name: 'Dita',
    groom_name: 'Fajar',
    template_id: 'template-id',
  }).slug, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.')
})
