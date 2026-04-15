(function(){
  console.debug('app.js loaded');
  const el = document.getElementById('headerWeather');
  if (!el) console.warn('app.js: #headerWeather element not found');
  const emojiEl = el ? el.querySelector('.hw-emoji') : null;
  const tempEl = el ? el.querySelector('.hw-temp') : null;
  const locEl = document.getElementById('hwLoc');

  function setLocation(text, opts = {}) {
    if (!locEl) return;
    if (!text) { locEl.textContent = ''; return; }
    if (opts.raw) { locEl.textContent = text; return; }
    if (opts.coords) { locEl.textContent = text; return; }
    // prefix with "in " unless already present
    if (!/^in\s/i.test(String(text))) locEl.textContent = `in ${text}`;
    else locEl.textContent = String(text);
  }

  const codeToEmoji = (code) => {
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '🌤️';
    if (code === 3) return '☁️';
    if ([45,48].includes(code)) return '🌫️';
    if ([51,53,55,56,57].includes(code)) return '🌦️';
    if ([61,63,65,66,67,80,81,82].includes(code)) return '🌧️';
    if ([71,73,75,77,85,86].includes(code)) return '❄️';
    if ([95,96,99].includes(code)) return '⛈️';
    return '🌈';
  };

  function showMessage(message, emoji) {
    if (tempEl) tempEl.textContent = message;
    if (emoji && emojiEl) emojiEl.textContent = emoji;
    if (el) el.classList.remove('loading');
  }

  if (navigator.geolocation && el) {
    navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit&timezone=auto`;
    fetch(url).then(r => r.json()).then(data => {
      if (!data || !data.current_weather) { showMessage('--°F','⚠️'); return; }
      const cw = data.current_weather;
      const temp = Math.round(cw.temperature);
      const emoji = codeToEmoji(cw.weathercode);
      // reverse geocode to get a short location (with robust fallback)
      setLocation('');
      fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`).then(r=>r.json()).then(g=>{
        console.debug('open-meteo reverse result:', g);
        try{
          const place = (g && g.results && g.results[0]) || (g && g[0]);
          const name = place && (place.name || place.locality || place.admin1 || place.country) || '';
          if (place && name) {
            setLocation(name);
            locEl.title = place.name || place.admin1 || place.country || '';
            return;
          }
        }catch(e){ console.warn('open-meteo parse failed', e); }
        // if open-meteo didn't return useful data, try Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`).then(r=>r.json()).then(nr=>{
          console.debug('nominatim reverse result:', nr);
          try{
            const addr = nr && nr.address;
            const city = addr && (addr.city || addr.town || addr.village || addr.hamlet || addr.county || addr.state);
            const display = city || (nr && nr.display_name) || '';
            if (display) {
              setLocation(display.split(',')[0]);
              locEl.title = nr.display_name || display;
              return;
            }
          }catch(e){ console.warn('nominatim parse failed', e); }
          // final fallback to coords
          setLocation(`${lat.toFixed(2)}, ${lon.toFixed(2)}`, {coords: true});
        }).catch(err=>{
          console.warn('nominatim fetch failed', err);
          setLocation(`${lat.toFixed(2)}, ${lon.toFixed(2)}`, {coords: true});
        });
      }).catch(err=>{
        console.warn('open-meteo fetch failed', err);
        // try Nominatim directly
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`).then(r=>r.json()).then(nr=>{
          console.debug('nominatim reverse result (fallback):', nr);
          try{
            const addr = nr && nr.address;
            const city = addr && (addr.city || addr.town || addr.village || addr.hamlet || addr.county || addr.state);
            const display = city || (nr && nr.display_name) || '';
            if (display) {
              setLocation(display.split(',')[0]);
              locEl.title = nr.display_name || display;
              return;
            }
          }catch(e){ console.warn('nominatim parse failed', e); }
          setLocation(`${lat.toFixed(2)}, ${lon.toFixed(2)}`, {coords: true});
        }).catch(e=>{ console.warn('nominatim fallback failed', e); if (locEl) locEl.textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}`; });
      });
      showMessage(`${temp}°F`, emoji);
    }).catch(err => {
      console.error(err);
      showMessage('Err','⚠️');
    });
    }, err => {
    if (err.code === 1) {
      showMessage('Enable location','📍');
      if (locEl) locEl.textContent = 'Location disabled';
    } else {
      showMessage('N/A','⚠️');
      if (locEl) locEl.textContent = '';
    }
    console.error(err);
    }, {timeout:10000});
  } else {
    // no geolocation or no header element; skip weather display silently
    console.debug('Geolocation or headerWeather not available; skipping weather widget');
  }

  // --- Work page filtering (runs regardless of weather widget) ---
  function initWorkFilters() {
    const buttons = Array.from(document.querySelectorAll('.filter-button'));
    const cards = Array.from(document.querySelectorAll('.work-card'));
    if (!buttons.length || !cards.length) return;

    function applyFilter(filter) {
      buttons.forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
      cards.forEach(c => {
        if (filter === 'all' || c.dataset.type === filter) c.classList.remove('hidden');
        else c.classList.add('hidden');
      });
    }

    buttons.forEach(b => b.addEventListener('click', () => applyFilter(b.dataset.filter)));

    // If page opened with fragment like #product-design, apply matching filter
    const frag = (location.hash || '').replace('#','');
    if (frag) {
      const mapping = { 'product-design': 'product-design', 'ux-research': 'ux-research', 'branding': 'branding' };
      if (mapping[frag]) applyFilter(mapping[frag]);
    }
  }

  // initialize filters on DOMContentLoaded (or immediately if DOM already parsed)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkFilters);
  } else {
    initWorkFilters();
  }

  // Hide/show work header on scroll (only if .work-header exists)
  function initHeaderToggle() {
    const header = document.querySelector('.work-header');
    if (!header) return;

    let lastY = window.scrollY || 0;
    let ticking = false;
    const threshold = 10;

    function update() {
      const currentY = window.scrollY || 0;
      // At top: remove overlap so header does not cover cards
      const container = document.querySelector('.portfolio-container');
      if (currentY < 120) {
        if (container) container.classList.remove('overlap');
      } else {
        // once user scrolls, allow slight overlap so filters remain visible
        if (container) container.classList.add('overlap');
      }

      lastY = currentY;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  // initialize header toggle immediately if DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHeaderToggle);
  else initHeaderToggle();

  // adjust spacer height so fixed header doesn't overlap content
  function updateHeaderSpacer() {
    const pageHeader = document.querySelector('header');
    const workHeader = document.querySelector('.work-header');
    const container = document.querySelector('.portfolio-container');
    const spacer = document.querySelector('.work-header-spacer');
    if (!spacer || !workHeader) return;

    const headerH = pageHeader ? pageHeader.offsetHeight : 0;
    const workH = workHeader.offsetHeight;
    const gap = 24; // visible gap between filters and cards
    const extraBuffer = 0; // no extra buffer; gap is exact 24px

    // always ensure spacer is large enough so the fixed header doesn't overlap content
    spacer.style.height = `${headerH + workH + gap + extraBuffer}px`;
  }

  // update spacer on load/resize and whenever overlap toggles
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateHeaderSpacer();
      window.addEventListener('resize', updateHeaderSpacer);
    });
  } else {
    updateHeaderSpacer();
    window.addEventListener('resize', updateHeaderSpacer);
  }

})();
