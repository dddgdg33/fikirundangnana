import assert from 'node:assert/strict'
import test from 'node:test'
import { getSupportedTemplateFields } from '../src/utils/templateCapabilities.ts'

test('maps bride/groom names and split parents to rendered composite markers', () => {
  const html = '<h1 data-template-couple></h1><p data-template-field="bride_parents"></p><p data-template-field="groom_parents"></p>'
  const fields = getSupportedTemplateFields(html, 'heritage-aruna')
  for (const field of ['bride_name', 'groom_name', 'bride_father', 'bride_mother', 'groom_father', 'groom_mother']) {
    assert.equal(fields.has(field), true)
  }
})

test('does not claim fields without a rendered target for regular templates', () => {
  const fields = getSupportedTemplateFields('<p data-template-field="quote"></p>', 'premium-kila')
  assert.equal(fields.has('quote'), true)
  assert.equal(fields.has('cover_message'), false)
  assert.equal(fields.has('bride_photo'), false)
})

test('recognizes Heritage Utary custom bridge targets', () => {
  const fields = getSupportedTemplateFields('<script>heritage-utary:data</script>', 'heritage-utary')
  assert.equal(fields.has('gallery'), true)
  assert.equal(fields.has('cover_photo'), true)
  assert.equal(fields.has('maps_url'), true)
})
