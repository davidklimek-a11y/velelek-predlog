/* Velelek — site.js. Everything here is an enhancement: every page works without it. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: hairline once the page scrolls. */
  var header = document.querySelector('[data-zaglavlje]');
  if (header) {
    var onScroll = function () { header.classList.toggle('je-skrolovano', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Mobile menu. */
  var menuBtn = document.querySelector('[data-meni-dugme]');
  var menu = document.getElementById('meni');
  if (menuBtn && menu) {
    var setMenu = function (open) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('je-otvoren', open);
    };
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
    });
    window.matchMedia('(min-width: 960px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* Home: the plant rises once, on first view. */
  var plant = document.querySelector('.uvod .fabrika');
  if (plant && !reduce) plant.classList.add('gradi');

  /* Catalog: filter by animal, product type and text, keeping the state in the URL. */
  var catalog = document.querySelector('[data-katalog]');
  if (catalog) {
    var lang = catalog.getAttribute('data-jezik');
    var total = parseInt(catalog.getAttribute('data-ukupno'), 10);
    var cards = [].slice.call(catalog.querySelectorAll('.kartica'));
    var input = catalog.querySelector('[data-trazi]');
    var countEl = catalog.querySelector('[data-broj]');
    var empty = catalog.querySelector('[data-prazno]');
    var heading = catalog.querySelector('[data-naslov]');
    var chipsZa = [].slice.call(catalog.querySelectorAll('.cip[data-za]'));
    var chipsTip = [].slice.call(catalog.querySelectorAll('.cip[data-tip]'));
    var chipAll = catalog.querySelector('.cip[data-sve]');
    var fold = function (s) {
      return (s || '').toLowerCase().replace(/\u0111/g, 'dj').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    };
    var state = { za: null, tip: null, q: '' };
    var current = catalog.querySelector('.cip[aria-current="page"]');
    if (current) {
      state.za = current.getAttribute('data-za');
      state.tip = current.getAttribute('data-tip');
    }
    var params = new URLSearchParams(location.search);
    if (params.get('za')) state.za = params.get('za');
    if (params.get('tip')) state.tip = params.get('tip');
    if (params.get('q')) { state.q = params.get('q'); if (input) input.value = state.q; }
    var baseTitle = heading ? heading.getAttribute('data-osnovni') : '';

    var render = function (push) {
      var q = fold(state.q.trim());
      var words = q ? q.split(/\s+/) : [];
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (!state.za || (' ' + c.getAttribute('data-za') + ' ').indexOf(' ' + state.za + ' ') > -1) &&
                 (!state.tip || (' ' + c.getAttribute('data-tip') + ' ').indexOf(' ' + state.tip + ' ') > -1);
        if (ok && words.length) {
          var hay = c.getAttribute('data-trazi');
          for (var i = 0; i < words.length; i++) { if (hay.indexOf(words[i]) === -1) { ok = false; break; } }
        }
        c.hidden = !ok;
        if (ok) shown++;
      });
      chipsZa.forEach(function (ch) { mark(ch, ch.getAttribute('data-za') === state.za); });
      chipsTip.forEach(function (ch) { mark(ch, ch.getAttribute('data-tip') === state.tip); });
      if (chipAll) mark(chipAll, !state.za && !state.tip);
      if (countEl) countEl.textContent = (lang === 'sr' ? 'Prikazano ' : 'Showing ') + shown + (lang === 'sr' ? ' od ' : ' of ') + total;
      if (empty) empty.hidden = shown !== 0;
      if (heading && push) {
        var parts = [];
        var za = chipsZa.filter(function (ch) { return ch.getAttribute('data-za') === state.za; })[0];
        var tip = chipsTip.filter(function (ch) { return ch.getAttribute('data-tip') === state.tip; })[0];
        if (za) parts.push(za.getAttribute('data-naslov'));
        if (tip) parts.push(tip.getAttribute('data-naslov'));
        heading.textContent = parts.length ? parts.join(' · ') : baseTitle;
        document.title = heading.textContent + ' — Velelek';
      }
      if (push) {
        var single = (state.za && !state.tip) ? chipsZa.filter(function (ch) { return ch.getAttribute('data-za') === state.za; })[0]
                   : (state.tip && !state.za) ? chipsTip.filter(function (ch) { return ch.getAttribute('data-tip') === state.tip; })[0]
                   : (!state.za && !state.tip) ? chipAll : null;
        var url = single ? new URL(single.href) : new URL(chipAll.href);
        if (!single) { url.searchParams.set('za', state.za); url.searchParams.set('tip', state.tip); }
        if (state.q.trim()) url.searchParams.set('q', state.q.trim());
        history.replaceState(null, '', url.pathname + url.search);
      }
    };
    var mark = function (el, on) {
      el.classList.toggle('je-izabran', on);
      if (on) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current');
    };
    var bind = function (list, key) {
      list.forEach(function (ch) {
        ch.addEventListener('click', function (ev) {
          if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
          ev.preventDefault();
          var v = ch.getAttribute('data-' + key);
          state[key] = state[key] === v ? null : v;
          render(true);
        });
      });
    };
    bind(chipsZa, 'za');
    bind(chipsTip, 'tip');
    if (chipAll) chipAll.addEventListener('click', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
      ev.preventDefault(); state.za = null; state.tip = null; render(true);
    });
    if (input) {
      var t;
      input.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { state.q = input.value; render(true); }, 120);
      });
    }
    var reset = catalog.querySelector('[data-ponisti]');
    if (reset) reset.addEventListener('click', function () {
      state.za = null; state.tip = null; state.q = ''; if (input) input.value = ''; render(true); if (input) input.focus();
    });
    render(false);
    /* On a phone the chip rows scroll sideways: bring the active chip into view without moving the page. */
    [].slice.call(catalog.querySelectorAll('.cipovi')).forEach(function (row) {
      var on = row.querySelector('.je-izabran');
      if (on && row.scrollWidth > row.clientWidth) row.scrollLeft = Math.max(0, on.offsetLeft - row.offsetLeft - 16);
    });
  }

  /* Contact form: compose an e-mail in the visitor's own program; nothing is sent from the page. */
  var form = document.querySelector('[data-upit]');
  if (form) {
    var err = form.querySelector('[data-greska]');
    var sr = doc.lang.indexOf('sr') === 0;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var missing = [];
      [].slice.call(form.querySelectorAll('[required]')).forEach(function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        f.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) missing.push(f);
      });
      if (missing.length) {
        err.textContent = sr ? 'Popunite ime, ispravnu e-mail adresu i poruku, pa pokušajte ponovo.'
                             : 'Please fill in your name, a valid e-mail address and a message, then try again.';
        err.hidden = false;
        missing[0].focus();
        return;
      }
      err.hidden = true;
      var v = function (id) { var el = form.querySelector('#' + id); return el ? el.value.trim() : ''; };
      var lines = [
        v('poruka'), '',
        '— ' + v('ime') + (v('firma') ? ', ' + v('firma') : ''),
        v('telefon') ? (sr ? 'Telefon: ' : 'Phone: ') + v('telefon') : '',
        'E-mail: ' + v('email')
      ].filter(function (l, i) { return i < 3 || l; });
      var subject = v('tema') + ' — ' + (v('firma') || v('ime'));
      location.href = form.getAttribute('action') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    });
  }

  /* Video: the poster is a plain link to YouTube; a click swaps in the privacy-enhanced player. Nothing loads from YouTube before that. */
  [].slice.call(document.querySelectorAll('a[data-video]')).forEach(function (link) {
    link.addEventListener('click', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
      ev.preventDefault();
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + link.getAttribute('data-video') + '?autoplay=1&rel=0';
      frame.title = link.getAttribute('data-naslov') || 'Video';
      frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      frame.setAttribute('allowfullscreen', '');
      var box = document.createElement('div');
      box.className = 'video__okvir';
      box.appendChild(frame);
      link.parentNode.replaceChild(box, link);
      frame.focus();
    });
  });
})();
