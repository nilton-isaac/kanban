import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const BAR_COUNT = 18

const STATUS_LABELS = {
  idle: 'Inativo',
  requesting: 'Solicitando',
  live: 'Ao vivo',
  error: 'Sem áudio',
  unsupported: 'Indisponível',
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function buildIdleLevels(themeId) {
  return Array.from({ length: BAR_COUNT }, (_, index) => {
    const base = 0.16 + (index % 4) * 0.018
    return clamp(base + (themeId === 'light' ? (index % 3) * 0.01 : 0), 0.14, 0.32)
  })
}

function buildIdleMetrics(themeId) {
  return themeId === 'light'
    ? { overall: 0.18, bass: 0.14, mid: 0.12, treble: 0.1 }
    : { overall: 0.22, bass: 0.18, mid: 0.14, treble: 0.12 }
}

function averageBand(data, start, end) {
  let total = 0
  let count = 0

  for (let index = start; index < end; index += 1) {
    total += data[index] || 0
    count += 1
  }

  return count ? total / count : 0
}

export default function ThemeEffects() {
  const { theme } = useTheme()
  const defaultHint = 'Compartilhe uma aba ou tela com áudio habilitado para fazer o fundo reagir ao som.'
  const audioRef = useRef({
    stream: null,
    audioOnlyStream: null,
    audioContext: null,
    source: null,
    analyser: null,
    data: null,
    frame: 0,
  })

  const [captureState, setCaptureState] = useState('idle')
  const [hint, setHint] = useState(defaultHint)
  const [levels, setLevels] = useState(() => buildIdleLevels(theme))
  const [metrics, setMetrics] = useState(() => buildIdleMetrics(theme))

  const resetVisuals = (themeId = theme) => {
    setLevels(buildIdleLevels(themeId))
    setMetrics(buildIdleMetrics(themeId))
  }

  const stopCapture = ({ state = 'idle', message = defaultHint } = {}) => {
    const audio = audioRef.current

    if (audio.frame) {
      cancelAnimationFrame(audio.frame)
    }

    audio.source?.disconnect?.()
    audio.analyser?.disconnect?.()
    void audio.audioContext?.close?.()

    audio.stream?.getTracks?.().forEach((track) => track.stop())
    audio.audioOnlyStream?.getTracks?.().forEach((track) => track.stop())

    audioRef.current = {
      stream: null,
      audioOnlyStream: null,
      audioContext: null,
      source: null,
      analyser: null,
      data: null,
      frame: 0,
    }

    setCaptureState(state)
    setHint(message)
    resetVisuals()
  }

  useEffect(() => {
    if (captureState !== 'live') {
      resetVisuals(theme)
    }
  }, [theme]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => stopCapture({ state: 'idle', message: defaultHint })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setCaptureState('unsupported')
      setHint('Seu navegador nao expoe Screen Capture API com audio nesta sessao.')
      resetVisuals()
      return
    }

    if (captureState === 'live') {
      stopCapture({ state: 'idle', message: defaultHint })
      return
    }

    setCaptureState('requesting')
    setHint('Escolha uma aba ou tela e confirme o compartilhamento com audio ativado no seletor do navegador.')

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((track) => track.stop())
        setCaptureState('error')
        setHint('Nenhuma trilha de audio foi fornecida. Compartilhe novamente com audio habilitado.')
        resetVisuals()
        return
      }

      const audioContext = new window.AudioContext()
      const audioOnlyStream = new MediaStream(audioTracks)
      const source = audioContext.createMediaStreamSource(audioOnlyStream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.82
      source.connect(analyser)
      await audioContext.resume()

      const audio = audioRef.current
      audio.stream = stream
      audio.audioOnlyStream = audioOnlyStream
      audio.audioContext = audioContext
      audio.source = source
      audio.analyser = analyser
      audio.data = new Uint8Array(analyser.frequencyBinCount)

      const handleStreamEnd = () => {
        stopCapture({ state: 'idle', message: defaultHint })
      }

      stream.getTracks().forEach((track) => {
        track.addEventListener('ended', handleStreamEnd, { once: true })
      })

      const tick = () => {
        const snapshot = audioRef.current
        if (!snapshot.analyser || !snapshot.data) return

        snapshot.analyser.getByteFrequencyData(snapshot.data)
        const chunkSize = Math.max(1, Math.floor(snapshot.data.length / BAR_COUNT))
        const nextLevels = Array.from({ length: BAR_COUNT }, (_, index) => {
          const start = index * chunkSize
          const end = index === BAR_COUNT - 1 ? snapshot.data.length : start + chunkSize
          const average = averageBand(snapshot.data, start, end) / 255
          return clamp(0.14 + average * 1.2, 0.14, 1)
        })

        const bass = averageBand(snapshot.data, 0, 10) / 255
        const mid = averageBand(snapshot.data, 10, 32) / 255
        const treble = averageBand(snapshot.data, 32, snapshot.data.length) / 255
        const overall = averageBand(snapshot.data, 0, snapshot.data.length) / 255

        setLevels((previous) =>
          previous.map((value, index) => value * 0.64 + nextLevels[index] * 0.36)
        )
        setMetrics((previous) => ({
          overall: previous.overall * 0.72 + overall * 0.28,
          bass: previous.bass * 0.68 + bass * 0.32,
          mid: previous.mid * 0.68 + mid * 0.32,
          treble: previous.treble * 0.68 + treble * 0.32,
        }))

        snapshot.frame = requestAnimationFrame(tick)
      }

      setCaptureState('live')
      setHint('Reatividade ligada. O glow e a malha de fundo agora seguem a energia do audio compartilhado.')
      tick()
    } catch (error) {
      const isPermissionAbort = error?.name === 'NotAllowedError' || error?.name === 'AbortError'
      setCaptureState(isPermissionAbort ? 'idle' : 'error')
      setHint(
        isPermissionAbort
          ? 'Captura cancelada. Quando quiser testar, compartilhe uma aba ou tela com audio.'
          : 'O navegador nao conseguiu iniciar a captura de audio nesta combinacao de sistema e browser.'
      )
      resetVisuals()
    }
  }

  return (
    <div className="theme-effects-root">
      <div
        className="synth-backdrop"
        aria-hidden="true"
        style={{
          '--audio-energy': metrics.overall.toFixed(3),
          '--audio-bass': metrics.bass.toFixed(3),
          '--audio-mid': metrics.mid.toFixed(3),
          '--audio-treble': metrics.treble.toFixed(3),
        }}
      >
        <div className="synth-backdrop__veil" />
        <div className="synth-backdrop__grid" />
        <div className="synth-backdrop__orb synth-backdrop__orb--cyan" />
        <div className="synth-backdrop__orb synth-backdrop__orb--violet" />
        <div className="synth-backdrop__orb synth-backdrop__orb--peach" />
        <div className="synth-backdrop__mesh" />
        <div className="synth-backdrop__pulse" />
        <div className="synth-backdrop__bars">
          {levels.map((level, index) => (
            <span
              key={index}
              style={{
                '--bar-level': level.toFixed(3),
              }}
            />
          ))}
        </div>
      </div>

      <aside className={`audio-reactive-panel${captureState === 'live' ? ' is-live' : ''}`}>
        <div className="audio-reactive-panel__row">
          <div>
            <span className="audio-reactive-panel__eyebrow">Fundo Reativo</span>
            <h2 className="audio-reactive-panel__title">Beta para audio do PC</h2>
          </div>
          <span className={`audio-reactive-panel__badge audio-reactive-panel__badge--${captureState}`}>
            {STATUS_LABELS[captureState]}
          </span>
        </div>

        <p className="audio-reactive-panel__text">
          Prototipo baseado em Screen Capture API + Web Audio. Ele responde melhor quando a aba ou tela e compartilhada com audio ligado.
        </p>

        <button type="button" onClick={startCapture} className="cyber-btn audio-reactive-panel__button">
          {captureState === 'live' ? 'Desativar reatividade' : 'Ativar audio do PC'}
        </button>

        <p className="audio-reactive-panel__hint">{hint}</p>
      </aside>
    </div>
  )
}
