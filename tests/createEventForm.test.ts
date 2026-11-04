import test from 'node:test'
import assert from 'node:assert/strict'
import { getCreateEventValidationErrors, slugifyEventTitle, type CreateEventDraft } from '../src/utils/eventDraft.ts'

test('accepts a complete create event form', () => {
  const draft: CreateEventDraft = {
    title: 'Pernikahan Dita & Fajar',
    slug: 'dita-fajar',
    bride_name: 'Dita Permatasari',
    groom_name: 'Fajar Nugroho',
    template_id: 'some-uuid-here',
  }
  const errors = getCreateEventValidationErrors(draft)
  assert.deepStrictEqual(errors, {}, 'Valid form should have no errors')
})

test('auto-generates slug from Indonesian event title', () => {
  const title = 'Pernikahan Rara & Gunawan'
  const slug = slugifyEventTitle(title)
  assert.strictEqual(slug, 'pernikahan-rara-gunawan')
})

test('handles special characters in slug generation', () => {
  const title = 'Wedding of Siti & Ahmad 2025!'
  const slug = slugifyEventTitle(title)
  assert.strictEqual(slug, 'wedding-of-siti-ahmad-2025')
})

test('rejects form without template_id', () => {
  const draft: CreateEventDraft = {
    title: 'Test Event',
    slug: 'test-event',
    bride_name: 'Bride',
    groom_name: 'Groom',
    template_id: '',
  }
  const errors = getCreateEventValidationErrors(draft)
  assert.ok(errors.template_id, 'Should require template_id')
})

test('rejects form with empty names', () => {
  const draft: CreateEventDraft = {
    title: 'Test Event',
    slug: 'test-event',
    bride_name: '   ',
    groom_name: '   ',
    template_id: 'uuid',
  }
  const errors = getCreateEventValidationErrors(draft)
  assert.ok(errors.bride_name, 'Should reject empty bride_name')
  assert.ok(errors.groom_name, 'Should reject empty groom_name')
})

test('rejects invalid slug formats', () => {
  const invalidSlugs = [
    'UPPERCASE',
    'has spaces',
    'has_underscore',
    'ends-with-dash-',
    '-starts-with-dash',
    'special@chars',
  ]
  
  for (const slug of invalidSlugs) {
    const draft: CreateEventDraft = {
      title: 'Test',
      slug,
      bride_name: 'Bride',
      groom_name: 'Groom',
      template_id: 'uuid',
    }
    const errors = getCreateEventValidationErrors(draft)
    assert.ok(errors.slug, `Should reject invalid slug: ${slug}`)
  }
})

test('accepts valid slug formats', () => {
  const validSlugs = [
    'lowercase',
    'with-dashes',
    'with123numbers',
    'multiple-words-here',
    'dita-fajar-2025',
  ]
  
  for (const slug of validSlugs) {
    const draft: CreateEventDraft = {
      title: 'Test',
      slug,
      bride_name: 'Bride',
      groom_name: 'Groom',
      template_id: 'uuid',
    }
    const errors = getCreateEventValidationErrors(draft)
    assert.ok(!errors.slug, `Should accept valid slug: ${slug}`)
  }
})
