/*!
 * Jembatan data generik untuk template undangan yang dimuat lewat iframe.
 *
 * Template hasil scrape dirender di dalam <iframe sandbox="allow-scripts">,
 * sehingga aplikasi induk tidak bisa menyentuh DOM-nya langsung. Komunikasi
 * dilakukan lewat postMessage: induk mengirim { type: 'invitation:data', payload },
 * skrip ini menyuntikkan nilainya ke elemen yang sudah ditandai atribut:
 *
 *   [data-template-couple]                -> "Nama & Nama"
 *   [data-template-guest]                 -> nama tamu
 *   [data-template-field="bride_name"]    -> teks (mendukung \n -> <br>)
 *   [data-template-image="bride_photo"]   -> background-image / src <img>
 *   [data-template-href="maps_url"]       -> atribut href
 *   [data-template-gallery] .e-gallery-item -> galeri
 *
 * Atribut boleh ditambahkan bertahap; elemen yang belum ditandai cukup
 * dibiarkan memakai konten demo bawaan template. Untuk tautan (Instagram,
 * lokasi acara) dan video, elemen demo bawaan template dikenali otomatis dari
 * pola URL/label tombol supaya perilakunya seragam di semua template.
 */
;(function () {
  'use strict'

  // Stub missing theme functions that cause fatal runtime errors when opening invitations
  window.updateMenuPosition = window.updateMenuPosition || function () {};

  // Polyfill accidental calls to addEventListener on HTMLCollection / NodeList by legacy theme scripts
  if (typeof HTMLCollection !== 'undefined' && !HTMLCollection.prototype.addEventListener) {
    HTMLCollection.prototype.addEventListener = function (type, listener, options) {
      for (var i = 0; i < this.length; i++) {
        this[i].addEventListener(type, listener, options);
      }
    };
  }
  if (typeof NodeList !== 'undefined' && !NodeList.prototype.addEventListener) {
    NodeList.prototype.addEventListener = function (type, listener, options) {
      for (var j = 0; j < this.length; j++) {
        this[j].addEventListener(type, listener, options);
      }
    };
  }

  // Fix Elementor webpack asset URL resolution across all scraped templates (which had "assets":"#")
  function getTemplateBasePath() {
    var match = window.location.pathname.match(/\/templates\/([^\/]+)\//);
    return match ? '/templates/' + match[1] + '/' : '/templates/heritage-aruna/';
  }

  function patchElementorConfig(config) {
    if (!config || typeof config !== 'object') return;
    var base = getTemplateBasePath();
    if (!config.urls || typeof config.urls !== 'object') config.urls = {};
    if (config.urls.assets === '#' || !config.urls.assets) {
      config.urls.assets = base;
    }
  }

  var _elementorFrontendConfig = window.elementorFrontendConfig;
  try {
    Object.defineProperty(window, 'elementorFrontendConfig', {
      configurable: true,
      enumerable: true,
      get: function () { return _elementorFrontendConfig; },
      set: function (val) {
        patchElementorConfig(val);
        _elementorFrontendConfig = val;
      }
    });
  } catch (e) {}
  if (_elementorFrontendConfig) patchElementorConfig(_elementorFrontendConfig);

  var _elementorProFrontendConfig = window.ElementorProFrontendConfig;
  try {
    Object.defineProperty(window, 'ElementorProFrontendConfig', {
      configurable: true,
      enumerable: true,
      get: function () { return _elementorProFrontendConfig; },
      set: function (val) {
        patchElementorConfig(val);
        _elementorProFrontendConfig = val;
      }
    });
  } catch (e) {}
  if (_elementorProFrontendConfig) patchElementorConfig(_elementorProFrontendConfig);

  var DATA_TYPE = 'invitation:data'
  var READY_TYPE = 'invitation:ready'

  function resolveUrl(value) {
    if (typeof value !== 'string' || !value) return null
    if (/^data:image\/(?:jpeg|png|webp);base64,/i.test(value)) return value
    try {
      var parsed = new URL(value, window.location.href)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null
    } catch (error) {
      return null
    }
  }

  function setText(element, value) {
    if (value.indexOf('\n') === -1) {
      element.textContent = value
      return
    }
    var lines = value.split('\n')
    var nodes = []
    for (var i = 0; i < lines.length; i++) {
      if (i) nodes.push(document.createElement('br'))
      nodes.push(document.createTextNode(lines[i]))
    }
    element.replaceChildren.apply(element, nodes)
  }

  function textTarget(element) {
    if (element.matches('.elementor-heading-title, h1, h2, h3, h4, p, span')) return element
    return element.querySelector('.elementor-heading-title, h1, h2, h3, h4, p, span') || element
  }

  function setElementText(element, value) {
    setText(textTarget(element), value)
  }

  function setBackgroundImage(element, url) {
    element.style.setProperty('background-image', 'url("' + url + '")', 'important')
  }

  function setPhoto(field, value) {
    var url = resolveUrl(value)
    if (!url) return
    var targets = document.querySelectorAll('[data-template-image="' + field + '"]')
    for (var i = 0; i < targets.length; i++) {
      var element = targets[i]
      var mode = element.getAttribute('data-template-image-mode')
      var image = element.tagName.toLowerCase() === 'img' ? element : element.querySelector('img')
      if (element.tagName.toLowerCase() === 'img' || mode === 'img' || (mode !== 'background' && image)) {
        if (image) {
          image.setAttribute('src', url)
          image.removeAttribute('srcset')
          image.removeAttribute('sizes')
        }
        else setBackgroundImage(element, url)
      } else {
        setBackgroundImage(element, url)
      }
    }
  }

  var INSTAGRAM_RE = /instagram\.com/i
  var MAPS_RE = /maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+(?:\/[a-z]{2})?\/maps|maps\.google/i
  var MAPS_LABEL_RE = /lihat lokasi|lihat peta|petunjuk arah|lokasi acara|buka maps|open maps/i
  var SOCIAL_ICON_RE = /elementor-social-icon/

  function linkLabel(element) {
    return (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()
  }

  /** Terapkan href ke elemen penanda; tombol lokasi/video disembunyikan bila kosong. */
  function applyHref(targets, field, fields) {
    var url = resolveUrl(fields[field])
    for (var i = 0; i < targets.length; i++) {
      var widget = targets[i].closest('.elementor-widget-button')
      if (url) {
        targets[i].setAttribute('href', url)
        if (widget) widget.removeAttribute('hidden')
      } else {
        targets[i].removeAttribute('href')
        if ((field === 'maps_url' || field === 'video_url') && widget) widget.setAttribute('hidden', '')
      }
    }
  }

  /** Pakai elemen bertanda bila ada, kalau tidak pakai hasil deteksi otomatis. */
  function pickTargets(field, fallback) {
    var marked = document.querySelectorAll('[data-template-href="' + field + '"]')
    return marked.length ? marked : fallback
  }

  function applyLinks(fields) {
    var anchors = document.querySelectorAll('a')
    var instagram = []
    var maps = []
    for (var i = 0; i < anchors.length; i++) {
      var anchor = anchors[i]
      if (anchor.hasAttribute('data-template-href')) continue
      if (SOCIAL_ICON_RE.test(anchor.className || '')) continue
      var href = anchor.getAttribute('href') || ''
      if (INSTAGRAM_RE.test(href)) instagram.push(anchor)
      else if (MAPS_RE.test(href) || MAPS_LABEL_RE.test(linkLabel(anchor))) maps.push(anchor)
    }

    applyHref(pickTargets('bride_ig', instagram.slice(0, 1)), 'bride_ig', fields)
    applyHref(pickTargets('groom_ig', instagram.slice(1, 2)), 'groom_ig', fields)
    applyHref(pickTargets('maps_url', maps), 'maps_url', fields)
    applyHref(document.querySelectorAll('[data-template-href="video_url"]'), 'video_url', fields)
  }

  /** Ubah tautan video apa pun menjadi URL embed yang aman dipasang di iframe. */
  function videoEmbedUrl(value) {
    if (typeof value !== 'string' || !value) return null
    var url
    try {
      url = new URL(value, window.location.href)
    } catch (error) {
      return null
    }
    var host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return 'https://www.youtube.com/embed' + url.pathname
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (url.pathname === '/watch') {
        var id = url.searchParams.get('v')
        return id ? 'https://www.youtube.com/embed/' + id : null
      }
      var segments = url.pathname.split('/')
      if (segments[1] === 'embed' || segments[1] === 'shorts' || segments[1] === 'live') {
        return segments[2] ? 'https://www.youtube.com/embed/' + segments[2] : null
      }
      return null
    }
    if (host === 'vimeo.com') return 'https://player.vimeo.com/video' + url.pathname.replace(/\/+$/, '')
    if (host === 'player.vimeo.com') return url.href
    return null
  }

  function createEmbedFrame(src) {
    var frame = document.createElement('iframe')
    frame.className = 'elementor-video'
    frame.setAttribute('src', src)
    frame.setAttribute('frameborder', '0')
    frame.setAttribute('allowfullscreen', '')
    frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share')
    frame.style.cssText = 'width:100%;height:100%;'
    return frame
  }

  function applyVideo(fields) {
    var embed = videoEmbedUrl(fields.video_url)
    var widgets = document.querySelectorAll('.elementor-widget-video')
    for (var i = 0; i < widgets.length; i++) {
      var widget = widgets[i]
      var frame = widget.querySelector('iframe')
      var holder = widget.querySelector('.elementor-video')

      if (!embed) {
        if (frame) frame.removeAttribute('src')
        widget.setAttribute('hidden', '')
        continue
      }

      widget.removeAttribute('hidden')
      var settings = widget.getAttribute('data-settings')
      if (settings) {
        try {
          var parsed = JSON.parse(settings)
          var type = embed.indexOf('https://player.vimeo.com') === 0 ? 'vimeo' : 'youtube'
          parsed.video_type = type
          if (type === 'vimeo') parsed.vimeo_url = fields.video_url
          else parsed.youtube_url = fields.video_url
          widget.setAttribute('data-settings', JSON.stringify(parsed))
        } catch (error) {
          /* data-settings bukan JSON valid: biarkan apa adanya */
        }
      }
      if (frame) frame.setAttribute('src', embed)
      else if (holder && !holder.querySelector('iframe')) holder.replaceChildren(createEmbedFrame(embed))
    }
  }

  function applyData(payload) {
    var fields = payload.fields || {}
    var coupleName = [payload.brideName, payload.groomName].filter(Boolean).join(' & ')

    if (coupleName) {
      var coupleTargets = document.querySelectorAll('[data-template-couple]')
      for (var c = 0; c < coupleTargets.length; c++) setElementText(coupleTargets[c], coupleName)
      document.title = coupleName + ' | Undangan Digital'
    }

    var guestTargets = document.querySelectorAll('[data-template-guest]')
    for (var g = 0; g < guestTargets.length; g++) {
      setElementText(guestTargets[g], payload.guestName || 'Tamu Undangan')
    }

    Object.keys(fields).forEach(function (field) {
      var value = fields[field]
      if (typeof value !== 'string') return
      var targets = document.querySelectorAll('[data-template-field="' + field + '"]')
      for (var t = 0; t < targets.length; t++) setElementText(targets[t], value)
    })

    var musicUrl = resolveUrl(fields.music_url)
    var audioTargets = document.querySelectorAll('[data-template-music]')
    for (var a = 0; a < audioTargets.length; a++) {
      if (musicUrl) audioTargets[a].setAttribute('src', musicUrl)
      else audioTargets[a].removeAttribute('src')
      if (typeof audioTargets[a].load === 'function') audioTargets[a].load()
    }

    applyLinks(fields)
    applyVideo(fields)

    setPhoto('cover_photo', payload.coverPhoto)
    setPhoto('feature_photo', payload.featurePhoto)
    setPhoto('gift_photo', payload.giftPhoto)
    setPhoto('bride_photo', payload.bridePhoto)
    setPhoto('groom_photo', payload.groomPhoto)

    if (Array.isArray(payload.gallery)) {
      var items = document.querySelectorAll('[data-template-gallery] .e-gallery-item')
      for (var i = 0; i < items.length; i++) {
        var item = items[i]
        var url = resolveUrl(payload.gallery[i])
        var image = item.querySelector('.e-gallery-image')

        if (!url) {
          item.style.display = 'none'
          continue
        }
        item.style.removeProperty('display')
        item.setAttribute('href', url)
        if (image) {
          setBackgroundImage(image, url)
          image.setAttribute('data-thumbnail', url)
        }
      }
    }
  }

  function attendanceValue(value) {
    var normalized = String(value || '').trim().toLowerCase()
    if (normalized === 'yes' || normalized === 'hadir') return 'yes'
    if (normalized === 'no' || normalized === 'tidak hadir' || normalized === 'tidak_hadir') return 'no'
    if (normalized === 'maybe' || normalized === 'ragu-ragu') return 'maybe'
    return ''
  }

  function bindRsvpForms() {
    var forms = document.querySelectorAll('form.elementor-form')
    for (var i = 0; i < forms.length; i++) {
      ;(function (form) {
        form.querySelectorAll('input[type="hidden"][required]').forEach(function (input) {
          input.removeAttribute('required')
        })

        // Auto-fill guest name from URL parameter
        var urlParams = new URLSearchParams(window.location.search)
        var guestName = urlParams.get('to')
        if (guestName) {
          var nameInput = form.querySelector('[name="form_fields[form_namalengkap]"]')
          if (nameInput && !nameInput.value) {
            nameInput.value = guestName
          }
        }

        form.addEventListener('submit', function (event) {
          var nameInput = form.querySelector('[name="form_fields[form_namalengkap]"]')
          if (!nameInput) return
          event.preventDefault()
          event.stopImmediatePropagation()

          var attendanceInput = form.querySelector('[name="form_fields[form_konfkehadiran]"]:checked') || form.querySelector('[name="form_fields[form_konfkehadiran]"]')
          var countInput = form.querySelector('[name="form_fields[form_jumlahtamu]"]')
          var noteInput = form.querySelector('[name="form_fields[form_ucapan]"]')
          var status = form.querySelector('[data-invitation-rsvp-status]')
          if (!status) {
            status = document.createElement('p')
            status.setAttribute('data-invitation-rsvp-status', 'true')
            status.setAttribute('role', 'status')
            status.setAttribute('aria-live', 'polite')
            status.style.cssText = 'margin:12px 0;padding:10px 12px;border-radius:4px;background:rgba(255,255,255,.14);color:inherit;font:inherit;'
            form.appendChild(status)
          }

          var name = String(nameInput.value || '').trim()
          var attendance = attendanceValue(attendanceInput && attendanceInput.value)
          if (!name || !attendance) {
            status.textContent = !name ? 'Nama wajib diisi.' : 'Silakan pilih konfirmasi kehadiran.'
            status.setAttribute('data-state', 'error')
            return
          }

          status.textContent = 'Mengirim konfirmasi…'
          status.setAttribute('data-state', 'pending')
          var submitButton = form.querySelector('button[type="submit"]')
          if (submitButton) submitButton.disabled = true
          window.parent.postMessage({
            type: 'invitation:rsvp-submit',
            payload: {
              name: name,
              attendance: attendance,
              guestCount: countInput ? countInput.value : 1,
              note: noteInput ? noteInput.value : '',
              formId: form.id || ''
            }
          }, '*')
        }, true)
      })(forms[i])
    }
  }

  function showRsvpResult(payload) {
    var forms = document.querySelectorAll('form.elementor-form')
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i]
      if (payload.formId && form.id !== payload.formId) continue
      var status = form.querySelector('[data-invitation-rsvp-status]')
      if (!status) continue
      status.textContent = payload.message || (payload.success ? 'Konfirmasi berhasil dikirim.' : 'Konfirmasi belum berhasil dikirim.')
      status.setAttribute('data-state', payload.success ? 'success' : 'error')
      var submitButton = form.querySelector('button[type="submit"]')
      if (submitButton) submitButton.disabled = false
      return
    }
  }

  window.addEventListener('message', function (message) {
    if (message.source !== window.parent || !message.data) return
    if (message.data.type === DATA_TYPE) applyData(message.data.payload || {})
    if (message.data.type === 'invitation:rsvp-result') showRsvpResult(message.data.payload || {})
  })

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindRsvpForms, { once: true })
  else bindRsvpForms()

  if (window.parent !== window) {
    window.parent.postMessage({ type: READY_TYPE }, '*')
  }
})()
