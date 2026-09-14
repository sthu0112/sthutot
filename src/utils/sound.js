// Simple pleasant click sound using Web Audio API — no file needed, instant
let ctx = null
function getCtx(){
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}
export function playClick(type='tap'){
  try{
    const c = getCtx()
    if (!c) return
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g); g.connect(c.destination)
    if (type === 'tap') {
      o.frequency.value = 880
      g.gain.setValueAtTime(0.12, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)
      o.type = 'sine'
      o.start(); o.stop(c.currentTime + 0.12)
    } else if (type === 'success') {
      o.frequency.setValueAtTime(520, c.currentTime)
      o.frequency.exponentialRampToValueAtTime(980, c.currentTime + 0.12)
      g.gain.setValueAtTime(0.14, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18)
      o.start(); o.stop(c.currentTime + 0.18)
    } else if (type === 'error') {
      o.frequency.value = 220
      g.gain.setValueAtTime(0.12, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
      o.type = 'square'
      o.start(); o.stop(c.currentTime + 0.2)
    } else if (type === 'pop') {
      o.frequency.value = 1200
      g.gain.setValueAtTime(0.1, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
      o.start(); o.stop(c.currentTime + 0.08)
    }
  } catch {}
}
export function useClickSound(){ return playClick }
