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

  // =========================================================================
  // GLOBAL ENGINE MODE CONTROLLER
  // =========================================================================
  window.snCurrentMode = "NATAL_DUAL";

  window.snSyncTwinLocation = function() {
    var latAEl = document.getElementById("sn-lat");
    var lonAEl = document.getElementById("sn-lon");
    var latA = latAEl ? latAEl.value : "";
    var lonA = lonAEl ? lonAEl.value : "";

    var latB = document.getElementById("sn-b-lat");
    var lonB = document.getElementById("sn-b-lon");
    if (latB && !latB.value && latA) latB.value = latA;
    if (lonB && !lonB.value && lonA) lonB.value = lonA;
  };

  window.snQuickSetTwin = function(minutesOffset) {
    var dateAEl = document.getElementById("sn-birthdate-date");
    var timeAEl = document.getElementById("sn-birthdate-time");
    var dateA = dateAEl ? dateAEl.value : "";
    var timeA = timeAEl ? timeAEl.value : "";
    if (!dateA || !timeA) return;

    var dt = new Date(dateA + "T" + timeA);
    dt.setMinutes(dt.getMinutes() + minutesOffset);

    var dtYear = dt.getFullYear();
    var dtMonth = String(dt.getMonth() + 1).padStart(2, '0');
    var dtDate = String(dt.getDate()).padStart(2, '0');
    var dtHours = String(dt.getHours()).padStart(2, '0');
    var dtMins = String(dt.getMinutes()).padStart(2, '0');

    var bDateEl = document.getElementById("sn-b-date");
    var bTimeEl = document.getElementById("sn-b-time");
    if (bDateEl) bDateEl.value = dtYear + "-" + dtMonth + "-" + dtDate;
    if (bTimeEl) bTimeEl.value = dtHours + ":" + dtMins;
    window.snSyncTwinLocation();
  };

  window.snSetEngineMode = function(mode) {
    window.snCurrentMode = mode;
    console.log("[Supernova] Engine mode active:", mode);

    var bWrap = document.getElementById("sn-chart-b-wrap");
    var twinBar = document.getElementById("sn-twin-quick-bar");
    var bTitle = document.getElementById("sn-chart-b-title");
    var bLoc = document.getElementById("sn-b-location-wrap");
    var h2El = document.getElementById("sn-houses-2");
    var h2Group = h2El ? h2El.closest("div") : null;

    document.querySelectorAll(".sn-mode-btn").forEach(function(btn) {
      btn.style.background = "transparent";
      btn.style.color = "#94a3b8";
    });

    var activeBtnId = {
      "NATAL_DUAL": "sn-btn-mode-natal",
      "TWIN_COMPARE": "sn-btn-mode-twin",
      "SYNASTRY": "sn-btn-mode-synastry",
      "TRANSITS": "sn-btn-mode-transits"
    }[mode];

    var activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
      activeBtn.style.background = "#0d9488";
      activeBtn.style.color = "#ffffff";
    }

    if (mode === "NATAL_DUAL") {
      if (bWrap) bWrap.style.display = "none";
      if (twinBar) twinBar.style.display = "none";
      if (h2Group) h2Group.style.display = "block";
    } else if (mode === "TWIN_COMPARE") {
      if (bWrap) bWrap.style.display = "block";
      if (twinBar) twinBar.style.display = "flex";
      if (bTitle) bTitle.textContent = "Twin / Second Chart Details";
      if (bLoc) bLoc.style.display = "grid";
      if (h2Group) h2Group.style.display = "none";
      window.snSyncTwinLocation();
    } else if (mode === "SYNASTRY") {
      if (bWrap) bWrap.style.display = "block";
      if (twinBar) twinBar.style.display = "none";
      if (bTitle) bTitle.textContent = "Partner / Second Chart Details";
      if (bLoc) bLoc.style.display = "grid";
      if (h2Group) h2Group.style.display = "none";
    } else if (mode === "TRANSITS") {
      if (bWrap) bWrap.style.display = "block";
      if (twinBar) twinBar.style.display = "none";
      if (bTitle) bTitle.textContent = "Transit Date & Time";
      if (h2Group) h2Group.style.display = "none";

      var now = new Date();
      var nowYMD = now.toISOString().split("T")[0];
      var nowHM = now.toTimeString().slice(0, 5);
      var bDateEl = document.getElementById("sn-b-date");
      var bTimeEl = document.getElementById("sn-b-time");
      if (bDateEl) bDateEl.value = nowYMD;
      if (bTimeEl) bTimeEl.value = nowHM;
      window.snSyncTwinLocation();
    }
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

  // --- SVG CHART WHEEL GENERATOR ---
  function snRenderWheelSVG(title, houses, planets, angles, isUnknown) {
    if (!houses || houses.length !== 12) return "";

    var size = 360;
    var center = size / 2;
    var rOuter = 165;
    var rZodiac = 135;
    var rHouses = 100;
    var rInner = 40;

    var ascDeg = (angles && angles.ASC !== undefined) ? angles.ASC : houses[0];

    function degToXY(deg, radius) {
      var angleDeg = (180 + (deg - ascDeg)) % 360;
      var rad = angleDeg * (Math.PI / 180);
      return {
        x: (center + radius * Math.cos(rad)).toFixed(2),
        y: (center + radius * Math.sin(rad)).toFixed(2)
      };
    }

    var zGlyphs = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
    var zColors = ["#f87171", "#34d399", "#60a5fa", "#38bdf8", "#fbbf24", "#a3e635", "#818cf8", "#f43f5e", "#fb923c", "#cbd5e1", "#38bdf8", "#a78bfa"];
    var pGlyphs = {
      "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
      "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇",
      "TrueNode": "☊", "NorthNode": "☊", "SouthNode": "☋", "Chiron": "⚷", "BlackMoonLilith": "⚸", "PartOfFortune": "⊗"
    };

    var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" style="width: 100%; height: auto; background: #0c0d14; border-radius: 50%; border: 1px solid #2d3348; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">';
    
    // Concentric Guide Rings
    svg += '<circle cx="' + center + '" cy="' + center + '" r="' + rOuter + '" fill="none" stroke="#2d3348" stroke-width="1.5" />';
    svg += '<circle cx="' + center + '" cy="' + center + '" r="' + rZodiac + '" fill="#12131a" stroke="#2d3348" stroke-width="1" />';
    svg += '<circle cx="' + center + '" cy="' + center + '" r="' + rHouses + '" fill="#181a24" stroke="#2d3348" stroke-width="1" />';
    svg += '<circle cx="' + center + '" cy="' + center + '" r="' + rInner + '" fill="#0c0d14" stroke="#2d3348" stroke-width="1" />';

    // 12 Zodiac Sign Segments
    for (var i = 0; i < 12; i++) {
      var sDeg = i * 30;
      var p1 = degToXY(sDeg, rOuter);
      var p2 = degToXY(sDeg, rZodiac);
      svg += '<line x1="' + p1.x + '" y1="' + p1.y + '" x2="' + p2.x + '" y2="' + p2.y + '" stroke="#232736" stroke-width="1" />';
      
      var midPos = degToXY(sDeg + 15, (rOuter + rZodiac) / 2);
      svg += '<text x="' + midPos.x + '" y="' + (parseFloat(midPos.y) + 5) + '" text-anchor="middle" font-size="14" fill="' + zColors[i] + '">' + zGlyphs[i] + '</text>';
    }

    // 12 House Cusps & Division Lines
    for (var h = 0; h < 12; h++) {
      var cusp = houses[h];
      var hp1 = degToXY(cusp, rZodiac);
      var hp2 = degToXY(cusp, rInner);
      var strokeColor = (h === 0 || h === 6) ? "#2dd4bf" : (h === 3 || h === 9 ? "#38bdf8" : "#2d3348");
      var strokeW = (h === 0 || h === 6 || h === 3 || h === 9) ? "1.8" : "0.7";
      svg += '<line x1="' + hp1.x + '" y1="' + hp1.y + '" x2="' + hp2.x + '" y2="' + hp2.y + '" stroke="' + strokeColor + '" stroke-width="' + strokeW + '" />';

      // House Number Labels
      var nextCusp = houses[(h + 1) % 12];
      var diff = (nextCusp - cusp + 360) % 360;
      var hMidDeg = (cusp + (diff / 2)) % 360;
      var numPos = degToXY(hMidDeg, (rHouses + rInner) / 2);
      svg += '<text x="' + numPos.x + '" y="' + (parseFloat(numPos.y) + 4) + '" text-anchor="middle" font-size="9" font-family="monospace" fill="#64748b">' + (h + 1) + '</text>';
    }

    // Plot Planetary Glyphs
    if (planets) {
      var pKeys = Object.keys(planets);
      pKeys.forEach(function(pName) {
        var glyph = pGlyphs[pName];
        if (!glyph) return;
        var pLon = (planets[pName] && planets[pName].lon !== undefined) ? planets[pName].lon : planets[pName];
        var pPos = degToXY(pLon, (rZodiac + rHouses) / 2);
        svg += '<text x="' + pPos.x + '" y="' + (parseFloat(pPos.y) + 5) + '" text-anchor="middle" font-size="13" fill="#f1f5f9" style="cursor:default;">' + glyph + '</text>';
      });
    }

    // Horizontal Ascendant Marker Line
    var ascP1 = degToXY(ascDeg, rOuter + 8);
    svg += '<line x1="' + ascP1.x + '" y1="' + ascP1.y + '" x2="' + degToXY(ascDeg, rZodiac).x + '" y2="' + degToXY(ascDeg, rZodiac).y + '" stroke="#2dd4bf" stroke-width="2.5" />';
    svg += '<text x="18" y="' + (center + 4) + '" font-size="10" font-family="sans-serif" font-weight="700" fill="#2dd4bf">ASC</text>';

    svg += '</svg>';
    return '<div style="font-size: 0.8rem; font-weight:600; color:#2dd4bf; margin-bottom:8px;">' + title + '</div>' + svg;
  }

  svg += '<text x="18" y="' + (center + 4) + '" font-size="10" font-family="sans-serif" font-weight="700" fill="#2dd4bf">ASC</text>';

    svg += '</svg>';
    return '<div style="font-size: 0.8rem; font-weight:600; color:#2dd4bf; margin-bottom:8px;">' + title + '</div>' + svg;
  }

  // =========================================================================
  // STEP 3: ENGINE MODE SWITCHER & QUICK-SET HELPERS
  // =========================================================================
window.snCurrentMode = "NATAL_DUAL";

  window.snSetEngineMode = function(mode) {
    window.snCurrentMode = mode;
    console.log("[Supernova] Engine mode changed to:", mode);

    var bWrap = document.getElementById("sn-chart-b-wrap");
    var twinBar = document.getElementById("sn-twin-quick-bar");
    var bTitle = document.getElementById("sn-chart-b-title");
    var bLoc = document.getElementById("sn-b-location-wrap");
    var h2Group = document.getElementById("sn-houses-2") ? document.getElementById("sn-houses-2").closest("div") : null;

    // Reset button styles
    var buttons = document.querySelectorAll(".sn-mode-btn");
    buttons.forEach(function(btn) {
      btn.style.background = "transparent";
      btn.style.color = "#94a3b8";
    });

    // Highlight selected button
    var activeBtnId = {
      "NATAL_DUAL": "sn-btn-mode-natal",
      "TWIN_COMPARE": "sn-btn-mode-twin",
      "SYNASTRY": "sn-btn-mode-synastry",
      "TRANSITS": "sn-btn-mode-transits"
    }[mode];

    var activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
      activeBtn.style.background = "#0d9488";
      activeBtn.style.color = "#ffffff";
    }

    if (mode === "NATAL_DUAL") {
      if (bWrap) bWrap.style.display = "none";
      if (twinBar) twinBar.style.display = "none";
      if (h2Group) h2Group.style.display = "block";
    } else if (mode === "TWIN_COMPARE") {
      if (bWrap) bWrap.style.display = "block";
      if (twinBar) twinBar.style.display = "flex";
      if (bTitle) bTitle.textContent = "Twin / Chart B Details";
      if (bLoc) bLoc.style.display = "grid";
      if (h2Group) h2Group.style.display = "none"; // Hide secondary house dropdown in twin mode
      window.snSyncTwinLocation();
    } else if (mode === "SYNASTRY") {
      if (bWrap) bWrap.style.display = "block";
      if (twinBar) twinBar.style.display = "none";
      if (bTitle) bTitle.textContent = "Partner / Chart B Details";
      if (bLoc) bLoc.style.display = "grid";
      if (h2Group) h2Group.style.display = "none";
    } else if (mode === "TRANSITS") {
      if (bWrap) bWrap.style.display = "block";
      if (twinBar) twinBar.style.display = "none";
      if (bTitle) bTitle.textContent = "Transit Date & Time";
      if (h2Group) h2Group.style.display = "none";

      var now = new Date();
      var nowYMD = now.toISOString().split("T")[0];
      var nowHM = now.toTimeString().slice(0, 5);
      var bDateEl = document.getElementById("sn-b-date");
      var bTimeEl = document.getElementById("sn-b-time");
      if (bDateEl) bDateEl.value = nowYMD;
      if (bTimeEl) bTimeEl.value = nowHM;
      window.snSyncTwinLocation();
    }
  };

  // --- MAIN PLACEMENT ENGINE ---
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

    var starScopeEl = document.getElementById("sn-star-scope");
    var starMethodEl = document.getElementById("sn-star-method");
    var starScope = starScopeEl ? starScopeEl.value : "MAJOR_GC";
    var rawMethod = starMethodEl ? starMethodEl.value : "";
    var starMethod = rawMethod.indexOf("COSMIC") !== -1 ? "COSMIC_ASCENDANCE" : "STELLA_PARTILE";

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
      star_method: starMethod,
      house_system: h1
    };

    var d1 = null;
    var d2Cusps = null;
    var d2Data = null;

    try {
      if (window.snCurrentMode === "TWIN_COMPARE" || window.snCurrentMode === "SYNASTRY" || window.snCurrentMode === "TRANSITS") {
        // Read Person B / Transit inputs
        var bDateEl = document.getElementById("sn-b-date");
        var bTimeEl = document.getElementById("sn-b-time");
        var bLatEl = document.getElementById("sn-b-lat");
        var bLonEl = document.getElementById("sn-b-lon");

        var bDateVal = (bDateEl && bDateEl.value) ? bDateEl.value : bDate;
        var bTimeVal = (bTimeEl && bTimeEl.value) ? bTimeEl.value : "12:00";
        var bLatVal = (bLatEl && bLatEl.value) ? bLatEl.value : lat;
        var bLonVal = (bLonEl && bLonEl.value) ? bLonEl.value : lon;

        var reqB = {
          datetime_local: bDateVal + " " + bTimeVal,
          timezone: tz,
          location: { lat: parseFloat(bLatVal), lon: parseFloat(bLonVal), elevation_m: 0 },
          asteroids: asteroidIdList,
          star_scope: starScope,
          star_method: starMethod,
          house_system: h1
        };

        // Fetch Chart A and Chart B concurrently
        var resArray = await Promise.all([
          fetch('https://supernova-calc-engine.onrender.com/api/v1/natal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(baseReq)
          }),
          fetch('https://supernova-calc-engine.onrender.com/api/v1/natal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqB)
          })
        ]);

        if (!resArray[0].ok || !resArray[1].ok) {
          var errA = await resArray[0].text();
          var errB = await resArray[1].text();
          alert("BACKEND REASON (A): " + errA + "\nBACKEND REASON (B): " + errB);
          throw new Error("One or both chart calculations failed.");
        }

        d1 = await resArray[0].json();
        d2Data = await resArray[1].json();
        d2Cusps = d2Data.houses;
        h2Label = (window.snCurrentMode === "TWIN_COMPARE") ? "Twin B (" + bTimeVal + ")" : "Chart B";

      } else {
        // STANDARD MODE: Natal Dual-House Systems
        var res1 = await fetch('https://supernova-calc-engine.onrender.com/api/v1/natal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseReq)
        });
        if (!res1.ok) {
          var errBody = await res1.text();
          alert("BACKEND REASON: " + errBody);
          throw new Error("Primary API error: " + res1.status + " Details: " + errBody);
        }
        d1 = await res1.json();

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
      }

    var d1 = null;
    var d2Cusps = null;
    var d2Data = null;

    try {
      if (window.snCurrentMode === "TWIN_COMPARE" || window.snCurrentMode === "SYNASTRY" || window.snCurrentMode === "TRANSITS") {
        // Read Person B / Transit inputs
        var bDateEl = document.getElementById("sn-b-date");
        var bTimeEl = document.getElementById("sn-b-time");
        var bLatEl = document.getElementById("sn-b-lat");
        var bLonEl = document.getElementById("sn-b-lon");

        var bDateVal = (bDateEl && bDateEl.value) ? bDateEl.value : bDate;
        var bTimeVal = (bTimeEl && bTimeEl.value) ? bTimeEl.value : "12:00";
        var bLatVal = (bLatEl && bLatEl.value) ? bLatEl.value : lat;
        var bLonVal = (bLonEl && bLonEl.value) ? bLonEl.value : lon;

        var reqB = {
          datetime_local: bDateVal + " " + bTimeVal,
          timezone: tz,
          location: { lat: parseFloat(bLatVal), lon: parseFloat(bLonVal), elevation_m: 0 },
          asteroids: asteroidIdList,
          star_scope: starScope,
          star_method: starMethod,
          house_system: h1
        };

        // Fetch Chart A and Chart B concurrently
        var resArray = await Promise.all([
          fetch('https://supernova-calc-engine.onrender.com/api/v1/natal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(baseReq)
          }),
          fetch('https://supernova-calc-engine.onrender.com/api/v1/natal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqB)
          })
        ]);

        if (!resArray[0].ok || !resArray[1].ok) {
          var errA = await resArray[0].text();
          var errB = await resArray[1].text();
          alert("BACKEND REASON (A): " + errA + "\nBACKEND REASON (B): " + errB);
          throw new Error("One or both chart calculations failed.");
        }

        d1 = await resArray[0].json();
        d2Data = await resArray[1].json();
        d2Cusps = d2Data.houses;
        h2Label = (window.snCurrentMode === "TWIN_COMPARE") ? "Twin B (" + bTimeVal + ")" : "Chart B";

      } else {
        // STANDARD MODE: Natal Dual-House Systems
        var res1 = await fetch('https://supernova-calc-engine.onrender.com/api/v1/natal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseReq)
        });
        if (!res1.ok) {
          var errBody = await res1.text();
          alert("BACKEND REASON: " + errBody);
          throw new Error("Primary API error: " + res1.status + " Details: " + errBody);
        }
        d1 = await res1.json();

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
      }
    };

    var d1 = null;
    var d2Cusps = null;

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
      d1 = await res1.json();

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
      if (d1.sect) raw += "Chart Sect:       " + d1.sect + " CHART\n";
      if (d1.moon_phase && d1.moon_phase.name) {
        raw += "Moon Phase:       " + d1.moon_phase.name + " (" + Math.round(d1.moon_phase.angle || 0) + "°)\n";
      }
      if (d1.intercepted_signs && d1.intercepted_signs.length > 0) {
        raw += "Intercepted:      " + d1.intercepted_signs.join(", ") + "\n";
      }
      if (isUnknown) {
        raw += "Time Status:      UNKNOWN" + (knownRising !== "NONE" ? " (" + knownRising + " Rising Specified)\n" : " (12:00 PM Solar Default)\n");
      }
      raw += "----------------------------------------------------------------------\n";
      raw += snPad("Body / Point", 16) + snPad("Longitude", 18) + snPad("H (" + h1Label.substr(0,4) + ")", 12);
      if (h2Label) raw += snPad("H (" + h2Label.substr(0,4) + ")", 12);
      raw += "\n----------------------------------------------------------------------\n";

      // 0. SECT & OVERVIEW BADGES
      var overviewEl = document.getElementById("sn-display-overview");
      if (overviewEl) {
        var sectName = d1.sect || "DAY";
        var sectColor = (sectName === "DAY") ? "#fbbf24" : "#818cf8";
        var sectIcon = (sectName === "DAY") ? "☀️" : "🌙";
        overviewEl.innerHTML = 
          '<span class="sn-meta-pill" style="border-color:' + sectColor + '; color:' + sectColor + ';">' + sectIcon + ' Sect: <strong>' + sectName + ' CHART</strong></span>' +
          '<span class="sn-meta-pill">Primary: <strong>' + h1Label + '</strong></span>' +
          (h2Label ? '<span class="sn-meta-pill">Comparison: <strong>' + h2Label + '</strong></span>' : '') +
          '<span class="sn-meta-pill">Zodiac: <strong>' + zod + '</strong></span>';
      }

      // 0b. MOON PHASE
      var moonEl = document.getElementById("sn-display-moon");
      if (moonEl && d1.moon_phase) {
        var pAngle = Math.round(d1.moon_phase.angle || 0);
        var pName = d1.moon_phase.name || "Unknown Phase";
        var illum = Math.round((1 - Math.cos((pAngle * Math.PI) / 180)) / 2 * 100);
        moonEl.innerHTML = 
          '<div><strong>Phase:</strong> ' + pName + ' <span style="color:#2dd4bf;">(' + pAngle + '° Elongation)</span></div>' +
          '<div style="color:#94a3b8; font-size:0.8rem; margin-top:2px;">Illumination: ~' + illum + '% | Lunar Cycle Progress: ' + Math.round((pAngle / 360) * 100) + '%</div>';
      }

      // --- RENDER DUAL WHEELS ---
      var wheelsWrap = document.getElementById("sn-wheels-wrap");
      var wPrimEl = document.getElementById("sn-wheel-primary");
      var wSecEl = document.getElementById("sn-wheel-secondary");

      if (wheelsWrap && wPrimEl && (!isUnknown || knownRising !== "NONE")) {
        wheelsWrap.style.display = "block";
        wPrimEl.innerHTML = snRenderWheelSVG(h1Label, d1.houses, d1.planets, d1.angles, isUnknown);

        if (d2Cusps && h2Label) {
          wSecEl.style.display = "block";
          wSecEl.innerHTML = snRenderWheelSVG(h2Label, d2Cusps, d1.planets, d1.angles, isUnknown);
        } else {
          wSecEl.style.display = "none";
          wSecEl.innerHTML = "";
        }
      } else if (wheelsWrap) {
        wheelsWrap.style.display = "none";
      }

      var angHtml = "";
      var plaHtml = "";
      var astHtml = "";
      var hseHtml = "";
      var aspBodies = {};

// --- 1. ANGLES & NODES ---
var angContainer = document.getElementById('sn-display-angles');
if (angContainer && d1.angles) {
  var angContent = "";

  if (isTwinMode && d2Data && d2Data.angles) {
    // 1. IF IN TWIN MODE: Build the side-by-side 2-column grid
    angContent += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 8px; font-weight:700; color:#2dd4bf; border-bottom:1px solid #2d3348; padding-bottom:4px;">';
    angContent += '  <div>Twin A (' + (document.getElementById("sn-birthdate-time").value || "") + ')</div>';
    angContent += '  <div>Twin B (' + (document.getElementById("sn-b-time").value || "") + ')</div>';
    angContent += '</div>';

    ["ASC", "MC", "DS", "IC"].forEach(function(ang) {
      var lonA = d1.angles[ang];
      var lonB = d2Data.angles[ang];
      angContent += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 4px;">';
      angContent += '  <div><strong>' + ang + ':</strong> ' + window.snFormatZodiac(lonA) + '</div>';
      angContent += '  <div><strong>' + ang + ':</strong> ' + (lonB !== undefined ? window.snFormatZodiac(lonB) : "—") + '</div>';
      angContent += '</div>';
    });

    if (d1.planets["TrueNode"] && d2Data.planets && d2Data.planets["TrueNode"]) {
      angContent += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 4px;">';
      angContent += '  <div><strong>True Node:</strong> ' + window.snFormatZodiac(d1.planets["TrueNode"].lon) + ' (H' + d1.planets["TrueNode"].house + ')</div>';
      angContent += '  <div><strong>True Node:</strong> ' + window.snFormatZodiac(d2Data.planets["TrueNode"].lon) + ' (H' + d2Data.planets["TrueNode"].house + ')</div>';
      angContent += '</div>';
    }
  } else {
    // 2. OTHERWISE (NATAL DUAL-HOUSE MODE): Run the single-person layout as usual
    angContent += '<div><strong>Ascendant (ASC):</strong> ' + window.snFormatZodiac(d1.angles.ASC) + '</div>';
    angContent += '<div><strong>Midheaven (MC):</strong> ' + window.snFormatZodiac(d1.angles.MC) + '</div>';
    angContent += '<div><strong>Descendant (DSC):</strong> ' + window.snFormatZodiac(d1.angles.DS) + '</div>';
    angContent += '<div><strong>Imum Coeli (IC):</strong> ' + window.snFormatZodiac(d1.angles.IC) + '</div>';
    if (d1.planets["TrueNode"]) {
      angContent += '<div><strong>True North Node:</strong> ' + window.snFormatZodiac(d1.planets["TrueNode"].lon) + ' (House ' + d1.planets["TrueNode"].house + ')</div>';
    }
  }

  angContainer.innerHTML = angContent;
}
      
// --- 2. PLANETARY BODIES ---
    var plaContainer = document.getElementById('sn-display-planets');
    if (plaContainer && d1.planets) {
      var plaContent = "";

      if (isTwinMode && d2Data && d2Data.planets) {
        plaContent += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 8px; font-weight:700; color:#2dd4bf; border-bottom:1px solid #2d3348; padding-bottom:4px;">';
        plaContent += '  <div>Twin A Placements</div>';
        plaContent += '  <div>Twin B Placements</div>';
        plaContent += '</div>';

        Object.keys(d1.planets).forEach(function(pName) {
          if (pName === "TrueNode") return;
          var pA = d1.planets[pName];
          var pB = d2Data.planets[pName];

          var dispName = (pName === "BlackMoonLilith") ? "Lilith" : (pName === "PartOfFortune" ? "Fortune" : pName);
          var retroA = pA.retro ? ' <span style="color:#f87171;font-size:0.75rem;">℞</span>' : '';
          var retroB = (pB && pB.retro) ? ' <span style="color:#f87171;font-size:0.75rem;">℞</span>' : '';

          var houseA = pA.house;
          var houseB = pB ? pB.house : "—";
          var hStyleA = (houseA !== houseB) ? 'color:#fbbf24; font-weight:700;' : '';
          var hStyleB = (houseA !== houseB) ? 'color:#fbbf24; font-weight:700;' : '';

          plaContent += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 4px; padding: 2px 0;">';
          plaContent += '  <div><strong>' + dispName + ':</strong> ' + window.snFormatZodiac(pA.lon) + retroA + ' (<span style="' + hStyleA + '">H' + houseA + '</span>)</div>';
          plaContent += '  <div><strong>' + dispName + ':</strong> ' + (pB ? window.snFormatZodiac(pB.lon) + retroB + ' (<span style="' + hStyleB + '">H' + houseB + '</span>)' : '—') + '</div>';
          plaContent += '</div>';
        });
      } else {
        // Your existing single-chart planetary loop
        Object.keys(d1.planets).forEach(function(pName) {
          if (pName === "TrueNode") return;
          var p = d1.planets[pName];
          var retroBadge = p.retro ? ' <span style="color:#f87171;font-size:0.75rem;">℞</span>' : '';
          var dualTag = "";
          if (d2Cusps) {
            var h2Idx = window.snHouseIndex(d2Cusps, p.lon);
            dualTag = ' <span style="color:#94a3b8;font-size:0.8rem;">(' + h1 + ': H' + p.house + ' | ' + h2Label + ': H' + h2Idx + ')</span>';
          } else {
            dualTag = ' <span style="color:#94a3b8;font-size:0.8rem;">(House ' + p.house + ')</span>';
          }
          var dispName = (pName === "BlackMoonLilith") ? "Black Moon Lilith" : (pName === "PartOfFortune" ? "Part of Fortune" : pName);
          plaContent += '<div><strong>' + dispName + ':</strong> ' + window.snFormatZodiac(p.lon) + retroBadge + dualTag + '</div>';
        });
      }
      plaContainer.innerHTML = plaContent;
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
      var starsList = (d1 && d1.fixed_stars) ? d1.fixed_stars : [];

      if (starsList.length > 0) {
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
// --- 4. HOUSE CUSPS ---
    var cuspContainer = document.getElementById('sn-display-houses');
    if (cuspContainer && d1.houses) {
      var cuspContent = "";

      if (isTwinMode && d2Data && d2Data.houses) {
        cuspContent += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 8px; font-weight:700; color:#2dd4bf; border-bottom:1px solid #2d3348; padding-bottom:4px;">';
        cuspContent += '  <div>Twin A Cusps (' + h1 + ')</div>';
        cuspContent += '  <div>Twin B Cusps (' + h1 + ')</div>';
        cuspContent += '</div>';

        for (var i = 0; i < 12; i++) {
          var hNum = i + 1;
          var cA = d1.houses[i];
          var cB = d2Data.houses[i];
          cuspContent += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 4px;">';
          cuspContent += '  <div><strong>House ' + hNum + ':</strong> ' + window.snFormatZodiac(cA) + '</div>';
          cuspContent += '  <div><strong>House ' + hNum + ':</strong> ' + (cB !== undefined ? window.snFormatZodiac(cB) : "—") + '</div>';
          cuspContent += '</div>';
        }
      } else {
        // Your existing single-chart house cusps loop
        for (var i = 0; i < 12; i++) {
          var hNum = i + 1;
          var c1 = d1.houses[i];
          var extra = "";
          if (d2Cusps) {
            extra = ' <span style="color:#94a3b8;font-size:0.8rem;">(' + h2Label + ': ' + window.snFormatZodiac(d2Cusps[i]) + ')</span>';
          }
          cuspContent += '<div><strong>House ' + hNum + ':</strong> ' + window.snFormatZodiac(c1) + extra + '</div>';
        }
      }
      cuspContainer.innerHTML = cuspContent;
    }

// --- 5b. INTERCEPTED SIGNS & DUPLICATED AXES ---
    var wrapEl = document.getElementById("sn-intercepts-wrap");
    var dispEl = document.getElementById("sn-display-intercepts");

    if (wrapEl && dispEl) {
      var intercepts = d1.intercepted_signs || [];
      var houseSigns = d1.house_signs || {};

      // Find duplicated signs (signs that appear on more than one cusp)
      var cuspSigns = d1.cusp_signs || [];
      var counts = {};
      cuspSigns.forEach(function(s) { counts[s] = (counts[s] || 0) + 1; });
      var duplicated = Object.keys(counts).filter(function(s) { return counts[s] > 1; });

      if (intercepts.length > 0 || duplicated.length > 0) {
        wrapEl.style.display = "block"; // <--- MUST UNHIDE THE WRAPPER!
        var out = "";
        
        if (intercepts.length > 0) {
          out += "<div><strong>Intercepted Signs:</strong> " + intercepts.join(", ") + " (contained entirely within a house without a cusp)</div>";
        }
        if (duplicated.length > 0) {
          out += "<div><strong>Duplicated Signs:</strong> " + duplicated.join(", ") + " (rule more than one house cusp)</div>";
        }
        dispEl.innerHTML = out;
      } else {
        // If whole sign, or if all 12 houses cleanly align with the 12 signs:
        if (h1 === "WHOLE" || h1 === "EQUAL") {
          wrapEl.style.display = "none";
        } else {
          // Show that the chart is balanced / non-intercepted
          wrapEl.style.display = "block";
          dispEl.innerHTML = "<div style='color: #94a3b8;'>No intercepted signs present. All twelve signs hold an active house cusp in this system.</div>";
        }
      }
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
