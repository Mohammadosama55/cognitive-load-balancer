import { useEffect, useRef, useState } from 'react'

const OBSERVE_MS = 3500

export function useBrowserTelemetry() {
  const [metrics, setMetrics] = useState(null)
  const activity = useRef({
    mousePositions: [],
    mouseTimestamps: [],
    clickCount: 0,
    scrollCount: 0,
    visibilityChanges: 0,
    keyTimestamps: [],
    startTime: Date.now(),
  })

  useEffect(() => {
    const a = activity.current

    const onMove = (e) => {
      a.mousePositions.push({ x: e.clientX, y: e.clientY })
      a.mouseTimestamps.push(Date.now())
    }
    const onClick = () => { a.clickCount++ }
    const onScroll = () => { a.scrollCount++ }
    const onVisibility = () => { if (document.hidden) a.visibilityChanges++ }
    const onKey = () => { a.keyTimestamps.push(Date.now()) }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)
    window.addEventListener('scroll', onScroll)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('keydown', onKey)

    const timer = setTimeout(() => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('keydown', onKey)
      setMetrics(buildMetrics(a))
    }, OBSERVE_MS)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return metrics
}

function buildMetrics(a) {
  const now = Date.now()
  const elapsedSec = Math.max(1, (now - a.startTime) / 1000)

  // ── 1. Time-of-day signal (real circadian variance) ──────────────────
  const d = new Date()
  const hourDecimal = d.getHours() + d.getMinutes() / 60
  // Morning 7-10: low load baseline; Afternoon 13-17: medium-high; Evening: higher
  const circadian = getCircadian(hourDecimal)

  // ── 2. Session fingerprint (unique per login, consistent per same minute) ─
  // Uses ms-level timestamp so each login session is different
  const sessionSeed = ((a.startTime % 100000) / 100000)   // 0-1, changes each login
  const minuteSeed = (d.getMinutes() % 10) / 10           // 0-0.9, changes each 10 min

  // ── 3. Device signals (user-specific baseline) ────────────────────────
  const screenArea = (window.screen.width * window.screen.height) / 2073600 // norm to 1080p
  const dpr = window.devicePixelRatio || 1
  const tzOffset = Math.abs(d.getTimezoneOffset()) / 720  // 0-1 (720 = UTC+12)

  // ── 4. Real browser activity measured in observation window ──────────
  const keyCount = a.keyTimestamps.length
  const clickCount = a.clickCount
  const scrollCount = a.scrollCount

  // Mouse movement analysis
  let mouseDist = 0
  let distArr = []
  for (let i = 1; i < a.mousePositions.length; i++) {
    const dx = a.mousePositions[i].x - a.mousePositions[i - 1].x
    const dy = a.mousePositions[i].y - a.mousePositions[i - 1].y
    const d2 = Math.sqrt(dx * dx + dy * dy)
    mouseDist += d2
    distArr.push(d2)
  }
  const avgDist = distArr.length ? mouseDist / distArr.length : 0
  const mouseVariance = distArr.length
    ? distArr.reduce((s, d2) => s + Math.pow(d2 - avgDist, 2), 0) / distArr.length
    : 0

  // Pause duration (longest gap between mouse events, or whole window if idle)
  let pauseDuration = elapsedSec  // default = idle
  if (a.mouseTimestamps.length > 1) {
    const gaps = []
    for (let i = 1; i < a.mouseTimestamps.length; i++) {
      gaps.push((a.mouseTimestamps[i] - a.mouseTimestamps[i - 1]) / 1000)
    }
    pauseDuration = Math.max(...gaps)
  }

  // Keystroke variance
  let keystrokeVar = 0.1
  if (a.keyTimestamps.length > 2) {
    const intervals = []
    for (let i = 1; i < a.keyTimestamps.length; i++) {
      intervals.push(a.keyTimestamps[i] - a.keyTimestamps[i - 1])
    }
    const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length
    keystrokeVar = Math.min(1, intervals.reduce((s, v) => s + Math.pow(v - avg, 2), 0)
      / intervals.length / 10000)
  }

  // ── 5. Compose final metrics by blending all signal sources ──────────
  // typing_speed: keys typed + circadian + session noise
  // Realistic range: 0 (idle) to 80 (fast typist)
  const typingSpeedBase = keyCount > 0
    ? Math.min(80, (keyCount / elapsedSec) * 60)
    : 5 + sessionSeed * 20 + circadian.restingActivity * 15

  const typing_speed = Math.max(0, typingSpeedBase + (minuteSeed - 0.5) * 8)

  // pause_duration: real or circadian-based
  const pause_duration = pauseDuration < elapsedSec
    ? Math.min(8, pauseDuration)
    : Math.min(8, 1.5 + circadian.fatigue * 4 + sessionSeed * 2)

  // eye_fixation: stillness + session baseline
  const movesPerSec = a.mousePositions.length / elapsedSec
  const rawFixation = Math.max(0, 1 - movesPerSec / 15)
  const eye_fixation = Math.min(1, Math.max(0,
    rawFixation * 0.6
    + (1 - circadian.fatigue) * 0.25
    + (1 - sessionSeed) * 0.15
  ))

  // keystroke_variance: measured or device-seeded
  const keystroke_variance = Math.min(1, Math.max(0,
    keystrokeVar * 0.5
    + (mouseVariance / 3000) * 0.3
    + sessionSeed * 0.2
  ))

  // window_switches: real + scroll proxy
  const window_switches = a.visibilityChanges
    + Math.floor(scrollCount / 4)
    + clickCount

  // typing_rhythm_score: regularity
  const typing_rhythm_score = Math.min(1, Math.max(0,
    (1 - keystrokeVar) * 0.5
    + (1 - circadian.fatigue) * 0.3
    + (minuteSeed > 0.5 ? 0.2 : 0)
  ))

  return {
    typing_speed: +typing_speed.toFixed(2),
    pause_duration: +pause_duration.toFixed(2),
    eye_fixation: +eye_fixation.toFixed(3),
    keystroke_variance: +keystroke_variance.toFixed(3),
    window_switches: Math.round(window_switches),
    typing_rhythm_score: +typing_rhythm_score.toFixed(3),
    _debug: {
      hour: hourDecimal.toFixed(1),
      circadian: circadian.fatigue.toFixed(2),
      sessionSeed: sessionSeed.toFixed(3),
      keyCount,
      mouseMoves: a.mousePositions.length,
    }
  }
}

function getCircadian(hour) {
  // Returns fatigue (0=fresh, 1=tired) and restingActivity based on time of day
  let fatigue, restingActivity
  if (hour >= 6 && hour < 10) {
    // Morning ramp-up: fresh, gradually warming up
    fatigue = 0.1 + (hour - 6) * 0.04
    restingActivity = 0.3 + (hour - 6) * 0.05
  } else if (hour >= 10 && hour < 13) {
    // Peak focus window
    fatigue = 0.25
    restingActivity = 0.6
  } else if (hour >= 13 && hour < 15) {
    // Post-lunch dip
    fatigue = 0.5 + (hour - 13) * 0.1
    restingActivity = 0.4
  } else if (hour >= 15 && hour < 18) {
    // Afternoon recovery
    fatigue = 0.35 + (hour - 15) * 0.05
    restingActivity = 0.5
  } else if (hour >= 18 && hour < 22) {
    // Evening wind-down
    fatigue = 0.5 + (hour - 18) * 0.08
    restingActivity = 0.3
  } else {
    // Late night / early morning
    fatigue = 0.85
    restingActivity = 0.1
  }
  return { fatigue, restingActivity }
}
