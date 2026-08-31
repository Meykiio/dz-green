export const home = {
  hero: {
    title: "Every tree Algeria plants, on one living map.",
    howItWorks: "How it works",
  },
  stats: {
    trees: "trees",
    wilayas: "wilayas",
    needWater: "need water",
    activeFires: "active fires",
  },
  cta: {
    plant: "I planted a tree",
    care: "Log care",
    fire: "Report a fire",
  },
  layers: {
    trees: "Trees",
    care: "Care",
    fires: "Fires",
    hotspots: "Satellite",
  },
  tooltip: {
    layers: {
      trees: "Show or hide tree plantings",
      care: "Show or hide care updates",
      fires: "Show or hide fire reports",
      hotspots: "Show or hide NASA satellite hotspot detections",
    },
    board: "Monthly wilaya race — approved plantings are summed per wilaya, reset on the 1st.",
    needsWater: "No care logged for this site in the last 14 days.",
    wilayaLevel:
      "The reporter didn't pin an exact spot — this marker sits at the wilaya's centre.",
  },
  aria: {
    showCard: "Show the action card",
    hideCard: "Hide the action card",
    map: "Interactive map of Algeria showing tree plantings, care updates and fire reports",
    board: "Leaderboard",
    list: "List",
  },
  views: {
    map: "Map",
    list: "List",
    board: "Board",
  },
  board: {
    heading: "This month's race",
    subtitle: "across {wilayas} — approved plantings only. Resets on the 1st.",
    empty: "No plantings this month yet.",
    emptyCta: "The first tree of the month could be yours.",
    leading: "Leading",
    thisMonth: "this month",
  },
  ticker: {
    planted: "{count} trees just planted in {wilaya}",
    fire: "Fire just reported in {wilaya}",
    care: "Trees just watered in {wilaya}",
  },
  mapFail: {
    webglTitle: "This browser can't draw the map",
    webglBody:
      "The map needs WebGL2 (3D graphics), which this browser or device doesn't provide. Try updating your browser or enabling hardware acceleration.",
    lostTitle: "The map lost its connection",
    lostBody: "The graphics connection dropped. If it doesn't come back, reload the page.",
    reload: "Reload map",
  },
  list: {
    empty: "Nothing on the map yet — be the first.",
    planted: "planted {date}",
    reported: "reported {date}",
    wilayaLevel: "wilaya-level",
    needsWater: "Needs water",
    fireTitle: "Fire",
    severityLarge: "large",
    severitySmall: "small",
  },
  detail: {
    aria: "Details",
    close: "Close details",
    altPlanting: "Planting in {wilaya}",
    altFire: "Reported fire",
    eyebrow: {
      fire: "Fire report",
      care: "Care update",
      site: "Planting site",
      hotspot: "NASA FIRMS",
    },
    hotspot: {
      title: "Satellite hotspot",
      confidence: "Confidence",
      confidenceValue: {
        nominal: "Nominal",
        high: "High",
      },
      frp: "Fire power",
      brightness: "Pixel temp",
      acquired: "Detected",
      satellite: "Satellite",
      daynight: {
        day: "day",
        night: "night",
      },
      disclaimer:
        "Satellite detection — not verified on the ground. It may be a small fire, a fire front, or an industrial heat source. For immediate danger call Protection Civile (14) or 1021.",
      attribution: "Data:",
    },
    field: {
      wilaya: "Wilaya",
      commune: "Commune",
      trees: "Trees",
      planted: "Planted",
      species: "Species",
      by: "By",
      status: "Status",
      reported: "Reported",
      severity: "Severity",
    },
    status: {
      active: "active",
      resolved: "resolved",
      falseAlarm: "false alarm",
    },
    severity: {
      small: "small",
      large: "large",
    },
    approxNotice:
      "Wilaya-level location — the reporter didn't drop an exact pin, so the marker sits at the wilaya's centre, not the real spot.",
    fireApproxNotice:
      "Wilaya-level location — no exact pin was dropped, so the marker sits at the wilaya's centre.",
    thirsty: "No care logged in the last 14 days — this site may need water.",
    timeline: "Care timeline",
    timelinePlanted: "Planted · {date}",
    timelineEmpty: "No care logged yet.",
    careCta: "Log care for this site",
    directions: "Directions",
    fireDirections: "Directions to this report",
    fireDisclaimer:
      "Community report — not an emergency service. For immediate danger call Protection Civile (14) or 1021.",
  },
  actions: {
    watered: "Watered",
    checked: "Checked",
    needsAttention: "Needs attention",
    update: "Update",
  },
};
