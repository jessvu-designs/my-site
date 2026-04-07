(function(){
  console.debug('app.js loaded');
  const el = document.getElementById('headerWeather');
  if (!el) console.warn('app.js: #headerWeather element not found');
  if (!el) return;
  const emojiEl = el.querySelector('.hw-emoji');
  const tempEl = el.querySelector('.hw-temp');
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
    tempEl.textContent = message;
    if (emoji) emojiEl.textContent = emoji;
    el.classList.remove('loading');
  }

  if (!navigator.geolocation) {
    showMessage('N/A', '⚠️');
    return;
  }

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
})();
