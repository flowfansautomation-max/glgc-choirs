/* Data layer for GLGC Choirs. Rows keyed by week (Sunday) and governor; the latest submission wins. */
window.CH = (function () {
  var CFG = window.CH_CONFIG, CHOIRS = window.CHOIRS;
  var NUMS = ['souls','reh_att','reh_off','sun_att','dsf_new'];
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var GOVS = []; CHOIRS.forEach(function (c) { c.governors.forEach(function (g) { g.choir = c; GOVS.push(g); }); });

  function parseDate(v) {
    if (v == null || v === '') return null; if (v instanceof Date) return v;
    var s = String(v), m = /^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?/.exec(s);
    if (m) return new Date(+m[1], +m[2], +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s); if (m) return new Date(+m[3], +m[2] - 1, +m[1]);   // dd/mm/yyyy (Ghana sheets)
    var d = new Date(s); return isNaN(d.getTime()) ? null : d;
  }
  function sundayOnOrAfter(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + (7 - x.getDay()) % 7); return x; }
  function label(d) { return d.getDate() + ' ' + MON[d.getMonth()]; }
  function isoWeek(d) { var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7); }
  function num(v) { if (v == null || v === '') return null; var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? null : n; }
  function key(s) { return String(s || '').toLowerCase().replace(/[^a-z]/g, ''); }
  // form dropdown names may carry invisible characters (e.g. "⁠Helen Feneku") — compare letters only
  function findGov(name) { var s = key(name); if (!s) return null;
    for (var i = 0; i < GOVS.length; i++) if (key(GOVS[i].name) === s) return GOVS[i];
    for (i = 0; i < GOVS.length; i++) { var g = key(GOVS[i].name); if (g.indexOf(s) === 0 || s.indexOf(g) === 0) return GOVS[i]; }
    return null; }

  function manualRows() { var rows = [];
    (window.MANUAL_REPORTS || []).forEach(function (r) { var g = findGov(r.governor); if (!g) return;
      NUMS.forEach(function (it) { if (r[it] != null) rows.push({ week: parseDate(r.week), gov: g.name, item: it, value: r[it] }); }); });
    return rows; }

  // Reads one form response sheet. kind = 'sat' or 'sun'.
  function fetchSheet(src, kind) {
    return new Promise(function (resolve, reject) {
      var cb = '__chcb' + kind + Date.now();
      window[cb] = function (resp) { delete window[cb];
        if (!resp || resp.status === 'error') return reject(new Error('Could not read the ' + (kind === 'sat' ? 'Saturday' : 'Sunday') + ' response sheet'));
        var L = resp.table.cols.map(function (c) { return String(c.label || '').toLowerCase().trim(); }), map = {}, iTs = -1, iDate = -1, iGov = -1;
        L.forEach(function (h, i) {
          if (h === 'timestamp') iTs = i; else if (h === 'date') iDate = i; else if (/governor/.test(h)) iGov = i;
          else if (/soul/.test(h)) map.souls = i;
          else if (/rehearsal/.test(h) && /attendance/.test(h)) map.reh_att = i;
          else if (/offering/.test(h)) map.reh_off = i;
          else if (/deep sea|new member/.test(h)) map.dsf_new = i;
          else if (/sunday/.test(h) && /attendance/.test(h)) map.sun_att = i;
        });
        var rows = [];
        resp.table.rows.forEach(function (r) { var c = r.c || []; function v(i) { return i >= 0 && c[i] ? c[i].v : null; }
          var ts = parseDate(v(iTs)), day = parseDate(v(iDate)) || ts, g = findGov(v(iGov)); if (!day || !g) return;
          Object.keys(map).forEach(function (item) { var val = v(map[item]); if (val == null || String(val).trim() === '') return;
            rows.push({ week: day, gov: g.name, item: item, value: val, ts: ts, kind: kind }); }); });
        resolve(rows); };
      var s = document.createElement('script');
      s.src = 'https://docs.google.com/spreadsheets/d/' + src.id + '/gviz/tq?' + (src.tab ? 'sheet=' + encodeURIComponent(src.tab) + '&' : '') + 'headers=1&tqx=out:json;responseHandler:' + cb;
      s.onerror = function () { reject(new Error('Could not reach the response sheet')); }; document.body.appendChild(s);
    });
  }

  // Sample numbers, only while no sheet is connected (three weekends, a few governors silent).
  function sampleRows() { var rows = [], weeks = ['2026-09-27','2026-10-04','2026-10-11'], seed = 7;
    function rnd(a, b) { seed = (seed * 9301 + 49297) % 233280; return a + Math.floor(seed / 233280 * (b - a + 1)); }
    weeks.forEach(function (w, wi) { var sun = parseDate(w);
      GOVS.forEach(function (g, gi) {
        if ((gi + wi) % 7 !== 3) { var sat = new Date(sun); sat.setDate(sat.getDate() - 1); sat.setHours(gi % 9 === 2 ? 19 : 16, 20);
          [['souls', rnd(0, 25)], ['reh_att', rnd(6, 30)], ['reh_off', rnd(0, 12) * 10]].forEach(function (p) { rows.push({ week: sun, gov: g.name, item: p[0], value: p[1], ts: sat, kind: 'sat' }); }); }
        if ((gi + wi) % 6 !== 4) { var ts = new Date(sun); ts.setHours(14, 5);
          [['sun_att', rnd(10, 60)], ['dsf_new', rnd(0, 6)]].forEach(function (p) { rows.push({ week: sun, gov: g.name, item: p[0], value: p[1], ts: ts, kind: 'sun' }); }); }
      }); });
    return rows; }

  function build(rows, sample) {
    var weeks = {}, data = {}, sub = {};
    rows.sort(function (a, b) { return (a.ts || a.week || 0) - (b.ts || b.week || 0); }).forEach(function (r) { if (!r.week || !r.gov) return;
      var sun = sundayOnOrAfter(r.week), k = sun.getTime(); weeks[k] = sun;
      var d = data[r.gov] || (data[r.gov] = {}), w = d[k] || (d[k] = {}); w[r.item] = num(r.value);
      if (r.ts && r.kind) { var s = sub[r.gov] || (sub[r.gov] = {}), sw = s[k] || (s[k] = {}); sw[r.kind] = r.ts; } });
    var W = Object.keys(weeks).map(Number).sort(function (a, b) { return a - b; }).map(function (k) { return { key: k, date: weeks[k], wk: isoWeek(weeks[k]), label: label(weeks[k]) }; });
    function get(gov, k, item) { var d = data[gov] && data[gov][k]; return d && d[item] != null ? d[item] : null; }
    function hasSat(gov, k) { return get(gov, k, 'souls') != null || get(gov, k, 'reh_att') != null || get(gov, k, 'reh_off') != null; }
    function hasSun(gov, k) { return get(gov, k, 'sun_att') != null || get(gov, k, 'dsf_new') != null; }
    function sum(govs, k, item) { var t = 0; govs.forEach(function (g) { var v = get(g.name, k, item); if (typeof v === 'number') t += v; }); return t; }
    return { weeks: W, choirs: CHOIRS, govs: GOVS, get: get, hasSat: hasSat, hasSun: hasSun, sum: sum, sample: sample };
  }
  function load(cb, onErr) {
    var man = manualRows(), srcs = [];
    if (CFG.SAT.id) srcs.push(fetchSheet(CFG.SAT, 'sat'));
    if (CFG.SUN.id) srcs.push(fetchSheet(CFG.SUN, 'sun'));
    if (!srcs.length) return cb(build(man.length ? man : sampleRows(), !man.length));
    Promise.all(srcs).then(function (lists) { cb(build(man.concat.apply(man, lists), false)); }).catch(onErr || function () {});
  }
  return { load: load };
})();
