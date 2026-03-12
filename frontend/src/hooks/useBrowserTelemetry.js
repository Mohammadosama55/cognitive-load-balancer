import { useEffect, useRef, useState } from 'react'

const OBSERVE_MS = 4000

export function useBrowserTelemetry() {
  const [metrics, setMetrics] = useState(null)
  const state = useRef({
    mousePositions: [],
    mouseTimestamps: [],
    clickCount: 0,
    scrollCount: 0,
    visibilityChanges: 0,
    keyTimestamps: [],
    startTime: Date.now(),
  })

  useEffect(() => {
    const s = state.current

    const onMouseMove = (e) => {
      s.mousePositions.push({ x: e.clientX, y: e.clientY })
      s.mouseTimestamps.push(Date.now())
    }
    const onClick = () => { s.clickCount++ }
    const onScroll = () => { s.scrollCount++ }
    const onVisibility = () => { if (document.hidden) s.visibilityChanges++ }
    const onKey = () => { s.keyTimestamps.push(Date.now()) }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('click', onClick)
    window.addEventListener('scroll', onScroll)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('keydown', onKey)

    const timer = setTimeout(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('keydown', onKey)

      const computed = computeMetrics(s)
      setMetrics(computed)
    }, OBSERVE_MS)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return metrics
}

function computeMetrics(s) {
  const now = Date.now()
  const elapsedSec = Math.max(1, (now - s.startTime) / 1000)

  // --- Mouse speed & variance ---
  let totalDist = 0
  let distances = []
  for (let i = 1; i < s.mousePositions.length; i++) {
    const dx = s.mousePositions[i].x - s.mousePositions[i - 1].x
    const dy = s.mousePositions[i].y - s.mousePositions[i - 1].y
    const d = Math.sqrt(dx * dx + dy * dy)
    totalDist += d
    distances.push(d)
  }
  const avgDist = distances.length ? totalDist / distances.length : 0
  const distVariance = distances.length
    ? distances.reduce((acc, d) => acc + Math.pow(d - avgDist, 2), 0) / distances.length
    : 0
  const mouseSpeed = totalDist / elapsedSec

  // High variance = erratic movement = higher cognitive load signal
  const mouseVarianceNorm = Math.min(1, distVariance / 2000)

  // --- Pause duration (gap between mouse events) ---
  let pauseDuration = 1.0
  if (s.mouseTimestamps.length > 1) {
    const gaps = []
    for (let i = 1; i < s.mouseTimestamps.length; i++) {
      gaps.push((s.mouseTimestamps[i] - s.mouseTimestamps[i - 1]) / 1000)
    }
    const maxGap = Math.max(...gaps)
    pauseDuration = Math.min(10, maxGap)
  } else {
    // No mouse movement = likely idle = longer pause
    pauseDuration = Math.min(10, elapsedSec)
  }

  // --- Keystroke timing variance ---
  let keystrokeVariance = 0.1
  if (s.keyTimestamps.length > 2) {
    const intervals = []
    for (let i = 1; i < s.keyTimestamps.length; i++) {
      intervals.push(s.keyTimestamps[i] - s.keyTimestamps[i - 1])
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((acc, v) => acc + Math.pow(v - avgInterval, 2), 0) / intervals.length
    keystrokeVariance = Math.min(1, variance / 10000)
  }

  // --- Typing speed (keys per second) ---
  const typingSpeed = s.keyTimestamps.length > 0
    ? Math.min(120, (s.keyTimestamps.length / elapsedSec) * 60)
    : 0

  // --- Window switches (visibility changes + scroll bursts as proxy) ---
  const windowSwitches = s.visibilityChanges + Math.floor(s.scrollCount / 5)

  // --- Eye fixation proxy: stillness ratio ---
  // Few mouse moves relative to time = more focused/fixated
  const movesPerSec = s.mousePositions.length / elapsedSec
  const eyeFixation = Math.max(0, Math.min(1, 1 - movesPerSec / 20))

  // --- Typing rhythm score: regularity of keystrokes ---
  const typingRhythmScore = s.keyTimestamps.length > 2
    ? Math.max(0, 1 - keystrokeVariance)
    : 0.5 + (mouseVarianceNorm < 0.3 ? 0.3 : 0)

  // --- Time-of-day baseline (people are fresher in morning) ---
  const hour = new Date().getHours()
  const timeOfDayFactor = hour < 9 ? 0.3
    : hour < 12 ? 0.1
    : hour < 14 ? 0.3  // post-lunch dip
    : hour < 17 ? 0.2
    : 0.4              // evening fatigue

  // Small per-session noise so each login is unique
  const sessionSeed = (s.startTime % 1000) / 1000
  const noise = (sessionSeed - 0.5) * 0.15

  // Compose final metrics — blend measured + time-of-day context
  return {
    typing_speed: Math.max(0, typingSpeed + timeOfDayFactor * 10 + noise * 20),
    pause_duration: Math.max(0.1, pauseDuration),
    eye_fixation: Math.min(1, Math.max(0, eyeFixation + noise)),
    keystroke_variance: Math.min(1, Math.max(0, keystrokeVariance + mouseVarianceNorm * 0.3)),
    window_switches: Math.max(0, windowSwitches),
    typing_rhythm_score: Math.min(1, Math.max(0, typingRhythmScore - timeOfDayFactor * 0.2 + noise)),
  }
}
