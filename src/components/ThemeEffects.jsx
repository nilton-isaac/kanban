import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeTone, isAudioReactiveTheme } from '../themes'

const BAR_COUNT = 18
const SYNTH_HINT = 'Compartilhe uma aba ou tela com audio habilitado para fazer o fundo reagir ao som.'
const LOCKED_HINT = 'Reatividade por audio disponivel apenas em Synth Dark e Synth Light.'

const STATUS_LABELS = {
  idle: 'Inativo',
  requesting: 'Solicitando',
  live: 'Ao vivo',
  error: 'Sem audio',
  unsupported: 'Indisponivel',
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function buildIdleLevels(tone) {
  return Array.from({ length: BAR_COUNT }, (_, index) => {
    const base = 0.16 + (index % 4) * 0.018
    return clamp(base + (tone === 'light' ? (index % 3) * 0.01 : 0), 0.14, 0.32)
  })
}

function buildIdleMetrics(tone) {
  return tone === 'light'
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

function describeCaptureError(error) {
  switch (error?.name) {
    case 'AbortError':
    case 'NotAllowedError':
      return {
        state: 'idle',
        message: 'Captura cancelada. Quando quiser testar, compartilhe uma aba ou tela com audio.',
      }
    case 'InvalidStateError':
      return {
        state: 'error',
        message: 'O navegador exige que a captura saia de um clique com a aba ativa. Tente novamente com a janela em foco.',
      }
    case 'NotReadableError':
      return {
        state: 'error',
        message: 'O sistema bloqueou a leitura da fonte escolhida. Tente outra aba ou janela com audio ativo.',
      }
    case 'TypeError':
      return {
        state: 'unsupported',
        message: 'Esta combinacao de navegador e sistema nao aceitou a captura de audio.',
      }
    default:
      return {
        state: 'error',
        message: 'O navegador nao conseguiu iniciar a captura de audio nesta sessao.',
      }
  }
}

export default function ThemeEffects() {
  const { theme } = useTheme()
  const tone = getThemeTone(theme)
  const supportsAudioReactive = isAudioReactiveTheme(theme)
  const defaultHint = supportsAudioReactive ? SYNTH_HINT : LOCKED_HINT

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
  const [levels, setLevels] = useState(() => buildIdleLevels(tone))
  const [metrics, setMetrics] = useState(() => buildIdleMetrics(tone))

  const resetVisuals = (nextTone = tone) => {
    setLevels(buildIdleLevels(nextTone))
    setMetrics(buildIdleMetrics(nextTone))
  }

  const stopCapture = ({ state = 'idle', message = defaultHint, nextTone = tone } = {}) => {
    const snapshot = audioRef.current

    if (snapshot.frame) {
      cancelAnimationFrame(snapshot.frame)
    }

    snapshot.source?.disconnect?.()
    snapshot.analyser?.disconnect?.()
    void snapshot.audioContext?.close?.()

    snapshot.stream?.getTracks?.().forEach((track) => track.stop())
    snapshot.audioOnlyStream?.getTracks?.().forEach((track) => track.stop())

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
    resetVisuals(nextTone)
  }

  useEffect(() => {
    if (!supportsAudioReactive && (captureState === 'live' || captureState === 'requesting')) {
      stopCapture({ state: 'idle', message: LOCKED_HINT, nextTone: tone })
      return
    }

    if (captureState !== 'live') {
      resetVisuals(tone)
      setHint(supportsAudioReactive ? SYNTH_HINT : LOCKED_HINT)
    }
  }, [theme, tone, supportsAudioReactive]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      const message = isAudioReactiveTheme(theme) ? SYNTH_HINT : LOCKED_HINT
      stopCapture({ state: 'idle', message, nextTone: getThemeTone(theme) })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startCapture = async () => {
    if (!supportsAudioReactive) {
      setCaptureState('idle')
      setHint(LOCKED_HINT)
      resetVisuals(tone)
      return
    }

    if (!window.isSecureContext) {
      setCaptureState('unsupported')
      setHint('A captura de tela com audio precisa rodar em HTTPS ou localhost.')
      resetVisuals(tone)
      return
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setCaptureState('unsupported')
      setHint('Seu navegador nao expoe Screen Capture API com audio nesta sessao.')
      resetVisuals(tone)
      return
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) {
      setCaptureState('unsupported')
      setHint('O navegador nao disponibiliza a pilha Web Audio necessaria para esta reatividade.')
      resetVisuals(tone)
      return
    }

    if (captureState === 'live') {
      stopCapture({ state: 'idle', message: SYNTH_HINT, nextTone: tone })
      return
    }

    setCaptureState('requesting')
    setHint('Escolha uma aba ou tela e confirme o compartilhamento com audio ligado no seletor do navegador.')

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          suppressLocalAudioPlayback: false,
        },
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'include',
        systemAudio: 'include',
      })

      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((track) => track.stop())
        setCaptureState('error')
        setHint('A fonte escolhida nao entregou audio. Funciona melhor ao compartilhar uma aba do navegador com audio ativo.')
        resetVisuals(tone)
        return
      }

      const audioContext = new AudioContextCtor()
      const audioOnlyStream = new MediaStream(audioTracks)
      const source = audioContext.createMediaStreamSource(audioOnlyStream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.82
      source.connect(analyser)
      await audioContext.resume()

      const snapshot = audioRef.current
      snapshot.stream = stream
      snapshot.audioOnlyStream = audioOnlyStream
      snapshot.audioContext = audioContext
      snapshot.source = source
      snapshot.analyser = analyser
      snapshot.data = new Uint8Array(analyser.frequencyBinCount)

      const handleStreamEnd = () => {
        stopCapture({ state: 'idle', message: SYNTH_HINT, nextTone: tone })
      }

      stream.getTracks().forEach((track) => {
        track.addEventListener('ended', handleStreamEnd, { once: true })
      })

      const tick = () => {
        const current = audioRef.current
        if (!current.analyser || !current.data) return

        current.analyser.getByteFrequencyData(current.data)
        const chunkSize = Math.max(1, Math.floor(current.data.length / BAR_COUNT))
        const nextLevels = Array.from({ length: BAR_COUNT }, (_, index) => {
          const start = index * chunkSize
          const end = index === BAR_COUNT - 1 ? current.data.length : start + chunkSize
          const average = averageBand(current.data, start, end) / 255
          return clamp(0.14 + average * 1.2, 0.14, 1)
        })

        const bass = averageBand(current.data, 0, 10) / 255
        const mid = averageBand(current.data, 10, 32) / 255
        const treble = averageBand(current.data, 32, current.data.length) / 255
        const overall = averageBand(current.data, 0, current.data.length) / 255

        setLevels((previous) =>
          previous.map((value, index) => value * 0.64 + nextLevels[index] * 0.36)
        )
        setMetrics((previous) => ({
          overall: previous.overall * 0.72 + overall * 0.28,
          bass: previous.bass * 0.68 + bass * 0.32,
          mid: previous.mid * 0.68 + mid * 0.32,
          treble: previous.treble * 0.68 + treble * 0.32,
        }))

        current.frame = requestAnimationFrame(tick)
      }

      setCaptureState('live')
      setHint('Reatividade ligada. O glow e a malha do fundo agora seguem a energia do audio compartilhado.')
      tick()
    } catch (error) {
      const result = describeCaptureError(error)
      setCaptureState(result.state)
      setHint(result.message)
      resetVisuals(tone)
    }
  }

  return (
    <>
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
      </div>

      {supportsAudioReactive ? (
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
            Prototipo baseado em Screen Capture API + Web Audio. Ele reage melhor quando a aba compartilhada ja esta emitindo audio.
          </p>

          <button type="button" onClick={startCapture} className="cyber-btn audio-reactive-panel__button">
            {captureState === 'live' ? 'Desativar reatividade' : 'Ativar audio do PC'}
          </button>

          <p className="audio-reactive-panel__hint">{hint}</p>
        </aside>
      ) : null}
    </>
  )
}
