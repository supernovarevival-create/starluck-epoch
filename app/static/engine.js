(function() {
  window.SN_CATALOG = [
    { id: 1, name: "Ceres" },
    { id: 2, name: "Pallas" },
    { id: 3, name: "Juno" },
    { id: 4, name: "Vesta" },
    { id: 5, name: "Astraea" },
    { id: 6, name: "Hebe" },
    { id: 7, name: "Iris" },
    { id: 8, name: "Flora" },
    { id: 9, name: "Metis" },
    { id: 10, name: "Hygiea" },
    { id: 16, name: "Psyche" },
    { id: 18, name: "Melpomene" },
    { id: 19, name: "Fortuna" },
    { id: 26, name: "Proserpina" },
    { id: 34, name: "Circe" },
    { id: 39, name: "Laetitia" },
    { id: 40, name: "Harmonia" },
    { id: 42, name: "Isis" },
    { id: 43, name: "Ariadne" },
    { id: 55, name: "Pandora" },
    { id: 60, name: "Echo" },
    { id: 76, name: "Freia" },
    { id: 80, name: "Sappho" },
    { id: 93, name: "Minerva" },
    { id: 94, name: "Aurora" },
    { id: 100, name: "Hekate" },
    { id: 103, name: "Hera" },
    { id: 105, name: "Artemis" },
    { id: 114, name: "Kassandra" },
    { id: 128, name: "Nemesis" },
    { id: 149, name: "Medusa" },
    { id: 157, name: "Dejanira" },
    { id: 212, name: "Medea" },
    { id: 258, name: "Tyche" },
    { id: 399, name: "Persephone" },
    { id: 433, name: "Eros" },
    { id: 1009, name: "Sirene" },
    { id: 1036, name: "Ganymed" },
    { id: 1181, name: "Lilith" },
    { id: 1221, name: "Amor" },
    { id: 1388, name: "Aphrodite" },
    { id: 1474, name: "Beira" },
    { id: 1912, name: "Anubis" },
    { id: 1923, name: "Osiris" },
    { id: 1924, name: "Horus" },
    { id: 1930, name: "Lucifer" },
    { id: 1981, name: "Midas" },
    { id: 2060, name: "Chiron" },
    { id: 2063, name: "Bacchus" },
    { id: 2101, name: "Adonis" },
    { id: 2102, name: "Tantalus" },
    { id: 3811, name: "Karma" },
    { id: 4227, name: "Kaali" },
    { id: 4386, name: "Lust" },
    { id: 4450, name: "Pan" },
    { id: 5145, name: "Pholus" },
    { id: 7066, name: "Nessus" },
    { id: 8405, name: "Asbolus" },
    { id: 10199, name: "Chariklo" },
    { id: 20000, name: "Varuna" },
    { id: 28978, name: "Ixion" },
    { id: 33154, name: "Talent" },
    { id: 50000, name: "Quaoar" },
    { id: 90377, name: "Sedna" },
    { id: 90482, name: "Orcus" },
    { id: 99942, name: "Apophis" },
    { id: 136108, name: "Haumea" },
    { id: 136199, name: "Eris" },
    { id: 136472, name: "Makemake" }
  ];

  window.snActive = [
    { id: 1, name: "Ceres" },
    { id: 2, name: "Pallas" },
    { id: 3, name: "Juno" },
    { id: 4, name: "Vesta" }
  ];

  window.snRenderChips = function() {
    var c = document.getElementById('sn-active-chips');
    if (!c) return;
    c.innerHTML = "";
    window.snActive.forEach(function(ast) {
      var s = document.createElement('span');
      s.className = "sn-active-tag";
      s.innerHTML = ast.name + ' (' + ast.id + ') <span class="sn-tag-remove" onclick="window.snRemoveAsteroid(' + ast.id + ')">✕</span>';
      c.appendChild(s);
    });
    var ctr = document.getElementById('sn-ast-counter');
    if (ctr) ctr.textContent = window.snActive.length + " / 10 active";
  };

  window.snPopulateDatalist = function() {
    var dl = document.getElementById('sn-ast-catalog');
    if (!dl) return;
    dl.innerHTML = "";
    window.SN_CATALOG.forEach(function(item) {
      var o = document.createElement('option');
      o.value = item.name + " (" + item.id + ")";
      dl.appendChild(o);
    });
  };

  window.snRemoveAsteroid = function(id) {
    window.snActive = window.snActive.filter(function(a) { return a.id !== id; });
    window.snRenderChips();
  };

  window.snSelectFromSearch = function() {
    var input = document.getElementById('sn-ast-search');
    if (!input) return;
    var val = input.value.trim();
    if (!val) return;

    if (window.snActive.length >= 10) {
      alert("You can select up to 10 active asteroid slots.");
      return;
    }

    var foundId = null;
    var foundName = null;

    var match = val.match(/^(.+?)\s*\((\d+)\)$/);
    if (match) {
      foundName = match[1].trim();
      foundId = parseInt(match[2]);
    } else {
      var dm = window.SN_CATALOG.find(function(item) {
        return item.name.toLowerCase() === val.toLowerCase();
      });
      if (dm) {
        foundId = dm.id;
        foundName = dm.name;
      } else {
        var num = parseInt(val);
        if (!isNaN(num) && num > 0) {
          foundId = num;
          var inCat = window.SN_CATALOG.find(function(item) { return item.id === num; });
          foundName = inCat ? inCat.name : ("Asteroid " + num);
        }
      }
    }

    if (!foundId) {
      alert("Could not identify that asteroid. Select from the dropdown or enter an ID number.");
      return;
    }

    if (window.snActive.some(function(a) { return a.id === foundId; })) {
      alert(foundName + " is already active.");
      input.value = "";
      return;
    }

    window.snActive.push({ id: foundId, name: foundName });
    window.snRenderChips();
    input.value = "";
  };

  window.snToggleAyanamsa = function() {
    var zEl = document.getElementById('sn-zodiac');
    var wrapper = document.getElementById('sn-ayanamsa-wrapper');
    if (wrapper && zEl) wrapper.style.display = (zEl.value === 'SIDEREAL') ? 'block' : 'none';
  };

  window.snFindCity = async function() {
    var cityEl = document.getElementById('sn-city');
    var status = document.getElementById('sn-coords-display');
    var btn = document.getElementById('sn-city-btn');
    if (!cityEl) return;

    var query = cityEl.value.trim();
    if (!query) {
      if (status) {
        status.textContent = "Please type a city name.";
        status.style.color = "#f87171";
      }
      return;
    }

    if (status) {
      status.textContent = "Searching...";
      status.style.color = "#a0a5b5";
    }
    if (btn) btn.textContent = "Searching...";

    try {
      var cleanQuery = query.split(',')[0].trim();
      var url = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(cleanQuery) + "&count=5&language=en&format=json";
      var res = await fetch(url);
      var data = await res.json();

      if (data && data.results && data.results.length > 0) {
        var place = data.results[0];
        var lat = parseFloat(place.latitude).toFixed(4);
        var lon = parseFloat(place.longitude).toFixed(4);
        var region = place.admin1 || place.country || "";
        var label = region ? (place.name + ", " + region) : place.name;

        var latEl = document.getElementById('sn-lat');
        var lonEl = document.getElementById('sn-lon');
        if (latEl) latEl.value = lat;
        if (lonEl) lonEl.value = lon;
        if (status) {
          status.textContent = label + " (" + lat + ", " + lon + ")";
          status.style.color = "#4ade80";
        }
        if (btn) btn.textContent = "Find City";
        return;
      }
    } catch (e) {
      console.warn("Geocoding failed:", e);
    }

    if (status) {
      status.textContent = "City not found. Type coordinates directly below.";
      status.style.color = "#f87171";
    }
    if (btn) btn.textContent = "Find City";
  };

  window.snAdjustToZodiac = function(deg, zType, ayVal) {
    var v = Number(deg);
    if (zType === 'SIDEREAL') {
      v = (v - ayVal + 360) % 360;
    }
    return (v + 360) % 360;
  };

  var zSigns = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

  var signOffsets = {
    "Aries": 0, "Taurus": 30, "Gemini": 60, "Cancer": 90,
    "Leo": 120, "Virgo": 150, "Libra": 180, "Scorpio": 210,
    "Sagittarius": 240, "Capricorn": 270, "Aquarius": 300, "Pisces": 330
  };

  window.snFormatZodiac = function(degVal) {
    var d = (Number(degVal) % 360 + 360) % 360;
    var sIdx = Math.floor(d / 30);
    var rem = d % 30;
    var degInt = Math.floor(rem);
    var minInt = Math.floor((rem - degInt) * 60);
    var minStr = minInt < 10 ? ("0" + minInt) : minInt;
    return degInt + "°" + minStr + "' " + zSigns[sIdx];
  };

  function snPad(str, len) {
    str = String(str || "");
    while (str.length < len) str += " ";
    return str;
  }

  function snDetermineHouse(lon, cusps) {
    if (!cusps || cusps.length !== 12) return 1;
    for (var i = 0; i < 12; i++) {
      var cur = cusps[i];
      var nxt = cusps[(i + 1) % 12];
      if (cur <= nxt) {
        if (lon >= cur && lon < nxt) return i + 1;
      } else {
        if (lon >= cur || lon < nxt) return i + 1;
      }
    }
    return 1;
  }

  function snGetHouseSystemName(code) {
    var map = {
      "PLACIDUS": "Placidus",
      "WHOLE": "Whole Sign",
      "KOCH": "Koch",
      "REGIOMONTANUS": "Regiomontanus",
      "CAMPANUS": "Campanus",
      "PORPHYRY": "Porphyry",
      "EQUAL": "Equal House"
    };
    return map[code] || code;
  }

  function snFormatDualHouseBadge(h1Num, h1Name, h2Num, h2Name) {
    if (h2Num && h2Name) {
      return ' <span style="color:#94a3b8; font-size:0.8rem;">(House ' + h1Num + ' [' + h1Name + '] / House ' + h2Num + ' [' + h2Name + '])</span>';
    }
    return ' <span style="color:#94a3b8; font-size:0.8rem;">(House ' + h1Num + ' [' + h1Name + '])</span>';
  }

  function snFindAspects(bodies, mode) {
    var asps = [
      { name: "Conjunction", angle: 0, orb: 8 },
      { name: "Sextile", angle: 60, orb: 5 },
      { name: "Square", angle: 90, orb: 7 },
      { name: "Trine", angle: 120, orb: 7 },
      { name: "Opposition", angle: 180, orb: 8 }
    ];
    if (mode === "DEGREE_TIGHT") asps.forEach(function(a) { a.orb = 3; });

    var res = [];
    var k = Object.keys(bodies);
    for (var i = 0; i < k.length; i++) {
      for (var j = i + 1; j < k.length; j++) {
        var n1 = k[i], n2 = k[j];
        var l1 = bodies[n1], l2 = bodies[n2];
        var diff = Math.abs(l1 - l2) % 360;
        if (diff > 180) diff = 360 - diff;

        if (mode === "SIGN_BASED") {
          var s1 = Math.floor(l1 / 30);
          var s2 = Math.floor(l2 / 30);
          var sDiff = Math.abs(s1 - s2);
          if (sDiff > 6) sDiff = 12 - sDiff;
          var aName = null;
          if (sDiff === 0) aName = "Conjunction";
          else if (sDiff === 2) aName = "Sextile";
          else if (sDiff === 3) aName = "Square";
          else if (sDiff === 4) aName = "Trine";
          else if (sDiff === 6) aName = "Opposition";
          if (aName) res.push(n1 + " " + aName + " " + n2 + " (Whole Sign)");
        } else {
          for (var a = 0; a < asps.length; a++) {
            var asp = asps[a];
            var orbActual = Math.abs(diff - asp.angle);
            if (orbActual <= asp.orb) {
              res.push(n1 + " " + asp.name + " " + n2 + " (" + orbActual.toFixed(1) + "°)");
              break;
            }
          }
        }
      }
    }
    return res;
  }

  // --- ASYNC MAIN CALCULATION FUNCTION ---
  window.snCalculatePlacements = async function() {
    var dateEl = document.getElementById('sn-birthdate-date');
    var timeEl = document.getElementById('sn-birthdate-time');
    var legacyDtEl = document.getElementById('sn-birthdate');
    var isUnknownEl = document.getElementById('sn-unknown-time');
    var isUnknown = isUnknownEl ? isUnknownEl.checked : false;
    var knownRisingEl = document.getElementById('sn-known-rising');
    var knownRising = knownRisingEl ? knownRisingEl.value : "NONE";

    var bDate = "";
    var bTime = "12:00";

    if (dateEl && dateEl.value) {
      bDate = dateEl.value;
      bTime = (timeEl && timeEl.value) ? timeEl.value : "12:00";
    } else if (legacyDtEl && legacyDtEl.value) {
      var parts = legacyDtEl.value.split('T');
      bDate = parts[0];
      bTime = parts[1] || "12:00";
    }

    if (!bDate) {
      alert("Please enter a birth date.");
      return;
    }

    var latEl = document.getElementById('sn-lat');
    var lonEl = document.getElementById('sn-lon');
    var lat = latEl ? latEl.value : "";
    var lon = lonEl ? lonEl.value : "";

    if (!lat || !lon) {
      alert("Please enter coordinates or find your city.");
      return;
    }

    var h1El = document.getElementById('sn-houses-1');
    var h2El = document.getElementById('sn-houses-2');
    var zodEl = document.getElementById('sn-zodiac');
    var aspEl = document.getElementById('sn-aspect-style');
    var ayanEl = document.getElementById('sn-ayanamsa');

    var h1 = h1El ? h1El.value : "PLACIDUS";
    var h2 = h2El ? h2El.value : "WHOLE";
    var zod = zodEl ? zodEl.value : "TROPICAL";
    var aspStyle = aspEl ? aspEl.value : "DEGREE_STD";
    var ayan = (ayanEl && ayanEl.value) ? parseFloat(ayanEl.value) : 0;

    var starScopeEl = document.getElementById("sn-star-scope") || document.getElementById("Fixed Stars & Cosmic Points");
    var starMethodEl = document.getElementById("sn-star-method") || document.getElementById("Fixed Stars & Points Calculations Method");
    var starScope = starScopeEl ? starScopeEl.value : "MAJOR_GC";
    var starMethod = starMethodEl ? starMethodEl.value : "STELLA_PARTILE";

    var h1Label = snGetHouseSystemName(h1);
    var h2Label = (h2 !== "NONE" && h2 !== h1) ? snGetHouseSystemName(h2) : null;

    var loading = document.getElementById('sn-loading');
    var disp = document.getElementById('sn-display-card');
    var out = document.getElementById('sn-output-card');

    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    var formattedDT = bDate + " " + bTime;

    if (loading) loading.style.display = "block";
    if (disp) disp.style.display = "none";
    if (out) out.style.display = "none";

    var asteroidIdList = window.snActive.map(function(a) { return parseInt(a.id); });

    var baseReq = {
      datetime_local: formattedDT,
      timezone: tz,
      location: { lat: parseFloat(lat), lon: parseFloat(lon), elevation_m: 0 },
      asteroids: asteroidIdList,
      star_scope: starScope,
      star_method: starMethod
    };

    try {
      var req1 = Object.assign({}, baseReq, { house_system: h1 });
      var res1 = await fetch('https://supernova-calc-engine.onrender.com/api/v1/natal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req1)
      });
if (!res1.ok) {
        var errBody = await res1.text();
        alert("BACKEND REASON: " + errBody);
        throw new Error("Primary API error: " + res1.status + " Details: " + errBody);
      }

      var d2Cusps = null;
      if (h2Label) {
        var req2 = Object.assign({}, baseReq, { house_system: h2 });
        var res2 = await fetch('https://supernova-calc-engine.onrender.com/api/v1/natal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req2)
        });
        if (res2.ok) {
          var d2 = await res2.json();
          d2Cusps = d2.houses;
        }
      }

      if (isUnknown && knownRising !== "NONE" && signOffsets[knownRising] !== undefined) {
        var forcedBase = signOffsets[knownRising];
        d1.houses = [];
        for (var hIdx = 0; hIdx < 12; hIdx++) {
          d1.houses.push((forcedBase + (hIdx * 30)) % 360);
        }
        h1Label = "Whole Sign (" + knownRising + " Rising)";
      }

      var raw = "";
      raw += "Zodiac System:    " + zod + (zod === 'SIDEREAL' ? " (Ayanamsa " + ayan + ")" : "") + "\n";
      raw += "Primary System:   " + h1Label + "\n";
      if (h2Label) raw += "Secondary System: " + h2Label + "\n";
      if (isUnknown) {
        raw += "Time Status:      UNKNOWN" + (knownRising !== "NONE" ? " (" + knownRising + " Rising Specified)\n" : " (12:00 PM Solar Default)\n");
      }
      raw += "----------------------------------------------------------------------\n";
      raw += snPad("Body / Point", 16) + snPad("Longitude", 18) + snPad("H (" + h1Label.substr(0,4) + ")", 12);
      if (h2Label) raw += snPad("H (" + h2Label.substr(0,4) + ")", 12);
      raw += "\n----------------------------------------------------------------------\n";

      var angHtml = "";
      var plaHtml = "";
      var astHtml = "";
      var hseHtml = "";
      var aspBodies = {};

      // 1. ANGLES & NODES
      if (isUnknown && knownRising === "NONE") {
        angHtml = '<div style="color: #94a3b8; font-style: italic;">Birth time unknown: Angles (ASC/MC) omitted; chart calculated using 12:00 PM solar defaults.</div>';
      } else if (isUnknown && knownRising !== "NONE") {
        var baseAsc = signOffsets[knownRising];
        angHtml += '<div><strong>Ascendant (ASC):</strong> 0°00\' ' + knownRising + ' <span style="color:#2dd4bf; font-size:0.75rem;">(Derived Whole Sign)</span></div>';
        angHtml += '<div><strong>Descendant (DS):</strong> 0°00\' ' + zSigns[(zSigns.indexOf(knownRising) + 6) % 12] + '</div>';
        raw += snPad("Ascendant", 16) + snPad("0°00' " + knownRising, 18) + snPad("House 1", 12) + "\n";
        aspBodies["Ascendant"] = baseAsc;
      } else if (d1.angles) {
        var ascDeg = window.snAdjustToZodiac(d1.angles.ASC, zod, ayan);
        var dsDeg = window.snAdjustToZodiac(d1.angles.DS, zod, ayan);
        var mcDeg = window.snAdjustToZodiac(d1.angles.MC, zod, ayan);
        var icDeg = window.snAdjustToZodiac(d1.angles.IC, zod, ayan);

        angHtml += '<div><strong>Ascendant (ASC):</strong> ' + window.snFormatZodiac(ascDeg) + '</div>';
        angHtml += '<div><strong>Descendant (DS):</strong> ' + window.snFormatZodiac(dsDeg) + '</div>';
        angHtml += '<div><strong>Midheaven (MC):</strong> ' + window.snFormatZodiac(mcDeg) + '</div>';
        angHtml += '<div><strong>Imum Coeli (IC):</strong> ' + window.snFormatZodiac(icDeg) + '</div>';

        raw += snPad("Ascendant", 16) + snPad(window.snFormatZodiac(ascDeg), 18) + snPad("House 1", 12) + (h2Label ? snPad("House 1", 12) : "") + "\n";
        raw += snPad("Descendant", 16) + snPad(window.snFormatZodiac(dsDeg), 18) + snPad("House 7", 12) + (h2Label ? snPad("House 7", 12) : "") + "\n";
        raw += snPad("Midheaven", 16) + snPad(window.snFormatZodiac(mcDeg), 18) + snPad("House 10", 12) + (h2Label ? snPad("House 10", 12) : "") + "\n";
        raw += snPad("Imum Coeli", 16) + snPad(window.snFormatZodiac(icDeg), 18) + snPad("House 4", 12) + (h2Label ? snPad("House 4", 12) : "") + "\n";

        aspBodies["Ascendant"] = ascDeg;
        aspBodies["Midheaven"] = mcDeg;
      }

      // 2. PLANETARY BODIES & NODES SEPARATION
      if (d1.planets) {
        for (var pName in d1.planets) {
          var pLon = window.snAdjustToZodiac(d1.planets[pName].lon, zod, ayan);
          var retro = d1.planets[pName].retro ? ' (R)' : '';
          var ph1 = snDetermineHouse(pLon, d1.houses);
          var ph2 = d2Cusps ? snDetermineHouse(pLon, d2Cusps) : null;
          var retroBadge = d1.planets[pName].retro ? ' <span style="color:#f87171; font-weight:bold;">(R)</span>' : '';
          var dualTag = snFormatDualHouseBadge(ph1, h1Label, ph2, h2Label);

          if (pName === "TrueNode" || pName === "NorthNode") {
            var nnLine = '<div><strong>North Node:</strong> ' + window.snFormatZodiac(pLon) + retroBadge + dualTag + '</div>';
            angHtml += nnLine;
            raw += snPad("NorthNode", 16) + snPad(window.snFormatZodiac(pLon) + retro, 18) + snPad("House " + ph1, 12);
            if (h2Label) raw += snPad("House " + ph2, 12);
            raw += "\n";

            var snLon = (pLon + 180) % 360;
            var snh1 = snDetermineHouse(snLon, d1.houses);
            var snh2 = d2Cusps ? snDetermineHouse(snLon, d2Cusps) : null;
            var snTag = snFormatDualHouseBadge(snh1, h1Label, snh2, h2Label);

            angHtml += '<div><strong>South Node:</strong> ' + window.snFormatZodiac(snLon) + retroBadge + snTag + '</div>';
            raw += snPad("SouthNode", 16) + snPad(window.snFormatZodiac(snLon) + retro, 18) + snPad("House " + snh1, 12);
            if (h2Label) raw += snPad("House " + snh2, 12);
            raw += "\n";

            aspBodies["NorthNode"] = pLon;
            aspBodies["SouthNode"] = snLon;
          } else {
            raw += snPad(pName, 16) + snPad(window.snFormatZodiac(pLon) + retro, 18) + snPad("House " + ph1, 12);
            if (h2Label) raw += snPad("House " + ph2, 12);
            raw += "\n";

            plaHtml += '<div><strong>' + pName + ':</strong> ' + window.snFormatZodiac(pLon) + retroBadge + dualTag + '</div>';
            aspBodies[pName] = pLon;
          }
        }
      }

      // 3. ASTEROIDS
      raw += "\n--- Asteroids ---\n";
      var astData = d1.asteroids || {};
      var astKeys = Object.keys(astData);
      
      if (astKeys.length > 0) {
        for (var i = 0; i < astKeys.length; i++) {
          var aKey = astKeys[i];
          var aObj = astData[aKey];
          var aId = parseInt(aObj.id || aKey);
          var mAst = window.snActive.find(function(a) { return a.id === aId; });
          var aName = mAst ? mAst.name : ("Asteroid " + aId);

          var aLon = window.snAdjustToZodiac(aObj.lon, zod, ayan);
          var aRetro = aObj.retro ? ' (R)' : '';
          var ah1 = snDetermineHouse(aLon, d1.houses);
          var ah2 = d2Cusps ? snDetermineHouse(aLon, d2Cusps) : null;

          raw += snPad(aName, 16) + snPad(window.snFormatZodiac(aLon) + aRetro, 18) + snPad("House " + ah1, 12);
          if (h2Label) raw += snPad("House " + ah2, 12);
          raw += "\n";

          var aBadge = aObj.retro ? ' <span style="color:#f87171; font-weight:bold;">(R)</span>' : '';
          var aTag = snFormatDualHouseBadge(ah1, h1Label, ah2, h2Label);
          astHtml += '<div><strong>' + aName + ':</strong> ' + window.snFormatZodiac(aLon) + aBadge + aTag + '</div>';
          aspBodies[aName] = aLon;
        }
      }
      var astBox = document.getElementById('sn-display-asteroids');
      if (astBox) astBox.innerHTML = astHtml || '<span style="color:#64748b;">None calculated</span>';

      // 4. FIXED STARS & COSMIC POINTS
      var starsBox = document.getElementById("sn-display-stars");
      var starsHeading = document.getElementById("sn-stars-heading");
      var starsList = d1.fixed_stars || [];

      if (starsList.length > 0 && starScope !== "NONE" && starMethod !== "NONE") {
        raw += "\n--- Fixed Stars & Cosmic Points ---\n";
        var starsTxt = "";
        starsList.forEach(function(s) {
          var starName = snPad(s.star, 24);
          var bodyName = snPad(s.body, 14);
          var pos = snPad(s.star_deg + " " + s.star_sign, 16);
          starsTxt += '<div><strong>' + s.star + '</strong> [' + s.star_deg + ' ' + s.star_sign + '] <span style="color:#2dd4bf;">Conjunct</span> <strong>' + s.body + '</strong> <span style="color:#94a3b8;">(orb ' + s.orb_formatted + ')</span></div>';
          raw += starName + " [ " + pos + " ] Conjunct " + bodyName + " (orb " + s.orb_formatted + ")\n";
        });

        if (starsHeading) starsHeading.style.display = "block";
        if (starsBox) {
          starsBox.innerHTML = starsTxt;
          starsBox.style.display = "block";
        }
      } else {
        if (starsHeading) starsHeading.style.display = "none";
        if (starsBox) {
          starsBox.innerHTML = "";
          starsBox.style.display = "none";
        }
      }

      // 5. STACKED HOUSE CUSPS
      if (Array.isArray(d1.houses) && (!isUnknown || knownRising !== "NONE")) {
        hseHtml += '<div style="font-size:0.85rem; text-transform:uppercase; color:#2dd4bf; font-weight:700; margin-bottom:8px;">House Cusps (' + h1Label + ')</div>';
        d1.houses.forEach(function(hDeg, idx) {
          var sh1 = window.snAdjustToZodiac(hDeg, zod, ayan);
          hseHtml += '<div>House ' + (idx + 1) + ': ' + window.snFormatZodiac(sh1) + '</div>';
        });
      } else if (isUnknown) {
        hseHtml = '<div style="color:#94a3b8; font-style:italic;">House cusps not defined for unknown time without specified rising sign.</div>';
      }

      if (d2Cusps && Array.isArray(d2Cusps) && (!isUnknown || knownRising !== "NONE")) {
        hseHtml += '<div style="font-size:0.85rem; text-transform:uppercase; color:#2dd4bf; font-weight:700; margin-top:20px; margin-bottom:8px;">House Cusps (' + h2Label + ')</div>';
        d2Cusps.forEach(function(hDeg, idx) {
          var sh2 = window.snAdjustToZodiac(hDeg, zod, ayan);
          hseHtml += '<div>House ' + (idx + 1) + ': ' + window.snFormatZodiac(sh2) + '</div>';
        });
      }

      // 6. ASPECTS
      var asps = snFindAspects(aspBodies, aspStyle);
      var aspHtml = "";
      if (asps.length > 0) {
        asps.forEach(function(item) { aspHtml += '<div>' + item + '</div>'; });
      } else {
        aspHtml = '<span style="color:#94a3b8;">No major aspects within chosen orbs</span>';
      }

      var angEl = document.getElementById('sn-display-angles');
      var plaEl = document.getElementById('sn-display-planets');
      var hseEl = document.getElementById('sn-display-houses');
      var aspElDisplay = document.getElementById('sn-display-aspects');
      var pBox = document.getElementById('sn-payload-box');

      if (angEl) angEl.innerHTML = angHtml;
      if (plaEl) plaEl.innerHTML = plaHtml;
      if (hseEl) hseEl.innerHTML = hseHtml;
      if (aspElDisplay) aspElDisplay.innerHTML = aspHtml;
      if (pBox) pBox.value = raw;

      if (disp) disp.style.display = "block";
      if (out) out.style.display = "block";

    } catch (err) {
      alert("Calculation timed out or instance is waking up. Please wait 10 seconds and try once more.");
      console.error(err);
    } finally {
      if (loading) loading.style.display = "none";
    }
  };

  window.snCopyPayload = function() {
    var box = document.getElementById('sn-payload-box');
    if (!box) return;
    box.select();
    box.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(box.value);
    var fb = document.getElementById('sn-copy-feedback');
    if (fb) {
      fb.style.display = "block";
      setTimeout(function() { fb.style.display = "none"; }, 4000);
    }
  };

  function initEngine() {
    if (document.getElementById('sn-active-chips')) {
      window.snPopulateDatalist();
      window.snRenderChips();
    } else {
      setTimeout(initEngine, 80);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initEngine();
  } else {
    document.addEventListener('DOMContentLoaded', initEngine);
  }
})();
