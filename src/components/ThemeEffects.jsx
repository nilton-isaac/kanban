import { useEffect, useRef, useState } from 'react'
import { MonitorUp, Music4, Sparkles, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeTone, isAudioReactiveTheme } from '../themes'

const BAR_COUNT = 18

const CAPTURE_MODES = [
  {
    id: 'tab',
    label: 'Outra aba',
    title: 'Aba do navegador',
    description: 'Melhor opcao para Spotify Web, YouTube ou qualquer audio vindo de outra aba.',
    helper: 'No seletor do navegador, escolha a aba correta e confirme Share tab audio.',
  },
  {
    id: 'screen',
    label: 'Tela inteira',
    title: 'Tela inteira',
    description: 'Melhor opcao para puxar audio geral do PC quando o navegador suporta system audio.',
    helper: 'No Windows com Chrome ou Edge, ative Share system audio quando essa opcao aparecer.',
  },
  {
    id: 'window',
    label: 'Janela ou app',
    title: 'Janela ou app',
    description: 'Serve para outra janela, mas muitos navegadores nao entregam audio nessa modalidade.',
    helper: 'Se vier sem audio, volte e use Tela inteira ou Aba do navegador.',
  },
]

const STATUS_LABELS = {
  idle: 'Pronto',
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
    const base = 0.14 + (index % 4) * 0.018
    return clamp(base + (tone === 'light' ? (index % 3) * 0.014 : 0), 0.14, 0.34)
  })
}

function buildIdleMetrics(tone) {
  return tone === 'light'
    ? { overall: 0.16, bass: 0.12, mid: 0.1, treble: 0.09 }
    : { overall: 0.2, bass: 0.16, mid: 0.12, treble: 0.1 }
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

function buildCaptureRequest(modeId) {
  const shared = {
    video: true,
    audio: {
      suppressLocalAudioPlayback: false,
    },
    selfBrowserSurface: 'include',
    surfaceSwitching: 'include',
    systemAudio: 'include',
  }

  if (modeId === 'screen') {
    return {
      ...shared,
      preferCurrentTab: false,
      monitorTypeSurfaces: 'include',
    }
  }

  if (modeId === 'window') {
    return {
      ...shared,
      preferCurrentTab: false,
    }
  }

  return {
    ...shared,
    preferCurrentTab: false,
  }
}

function describeCaptureError(error) {
  switch (error?.name) {
    case 'AbortError':
    case 'NotAllowedError':
      return {
        state: 'idle',
        message: 'Captura cancelada. Quando quiser testar, abra o modal novamente e compartilhe uma fonte com audio.',
      }
    case 'InvalidStateError':
      return {
        state: 'error',
        message: 'O navegador exige um clique com a aba ativa. Deixe esta janela em foco e tente de novo.',
      }
    case 'NotReadableError':
      return {
        state: 'error',
        message: 'A fonte escolhida nao deixou o navegador ler o audio. Tente outra aba, tela inteira ou outro browser.',
      }
    case 'TypeError':
      return {
        state: 'unsupported',
        message: 'Esta combinacao de navegador e sistema recusou as opcoes de captura. Vamos tentar o fallback mais simples.',
      }
    default:
      return {
        state: 'error',
        message: 'O navegador nao conseguiu iniciar a captura de audio nesta sessao.',
      }
  }
}

export default function ThemeEffects({ open = false, onClose, onStateChange }) {
  const { theme } = useTheme()
  const tone = getThemeTone(theme)
  const supportsAudioReactive = isAudioReactiveTheme(theme)

  const defaultHint = supportsAudioReactive
    ? 'Abra o modal e escolha uma aba, uma tela inteira ou uma janela com audio.'
    : 'Reatividade por audio disponivel apenas em Synth Dark e Synth Light.'

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
  const [captureMode, setCaptureMode] = useState('screen')
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
    onStateChange?.(captureState)
  }, [captureState, onStateChange])

  useEffect(() => {
    if (!supportsAudioReactive) {
      if (captureState === 'live' || captureState === 'requesting') {
        stopCapture({ state: 'idle', message: defaultHint, nextTone: tone })
      }

      if (open) {
        onClose?.()
      }
    } else if (captureState !== 'live') {
      setHint(defaultHint)
      resetVisuals(tone)
    }
  }, [supportsAudioReactive, open, defaultHint, tone]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      stopCapture({ state: 'idle', message: defaultHint, nextTone: tone })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startCapture = async () => {
    if (!supportsAudioReactive) {
      setCaptureState('idle')
      setHint(defaultHint)
      resetVisuals(tone)
      return
    }

    if (!window.isSecureContext) {
      setCaptureState('unsupported')
      setHint('A captura com audio precisa rodar em HTTPS ou localhost.')
      resetVisuals(tone)
      return
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setCaptureState('unsupported')
      setHint('Este navegador nao expoe Screen Capture API nesta sessao.')
      resetVisuals(tone)
      return
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) {
      setCaptureState('unsupported')
      setHint('Web Audio nao esta disponivel neste navegador.')
      resetVisuals(tone)
      return
    }

    if (captureState === 'live') {
      stopCapture({ state: 'idle', message: defaultHint, nextTone: tone })
      return
    }

    setCaptureState('requesting')
    setHint('O seletor do navegador vai abrir. Escolha a fonte e confirme o compartilhamento com audio.')

    const request = buildCaptureRequest(captureMode)

    try {
      let stream

      try {
        stream = await navigator.mediaDevices.getDisplayMedia(request)
      } catch (error) {
        if (error?.name === 'TypeError') {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        } else {
          throw error
        }
      }

      const audioTracks = stream.getAudioTracks()

      if (audioTracks.length === 0) {
        stream.getTracks().forEach((track) => track.stop())
        setCaptureState('error')
        setHint(
          captureMode === 'window'
            ? 'A janela escolhida veio sem audio. Para apps do PC, tente Tela inteira com Share system audio.'
            : 'A fonte escolhida nao entregou audio. Tente outra fonte e garanta que o audio foi habilitado no seletor.'
        )
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
        stopCapture({ state: 'idle', message: defaultHint, nextTone: tone })
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
          return clamp(0.12 + average * 1.26, 0.12, 1)
        })

        const bass = averageBand(current.data, 0, 10) / 255
        const mid = averageBand(current.data, 10, 32) / 255
        const treble = averageBand(current.data, 32, current.data.length) / 255
        const overall = averageBand(current.data, 0, current.data.length) / 255

        setLevels((previous) => previous.map((value, index) => value * 0.62 + nextLevels[index] * 0.38))
        setMetrics((previous) => ({
          overall: previous.overall * 0.7 + overall * 0.3,
          bass: previous.bass * 0.68 + bass * 0.32,
          mid: previous.mid * 0.68 + mid * 0.32,
          treble: previous.treble * 0.68 + treble * 0.32,
        }))

        current.frame = requestAnimationFrame(tick)
      }

      setCaptureState('live')
      setHint('Reatividade ligada. O fundo agora acompanha a energia do audio compartilhado.')
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
          <div className="synth-backdrop__orb synth-backdrop__orb--cyan" />
          <div className="synth-backdrop__orb synth-backdrop__orb--violet" />
          <div className="synth-backdrop__orb synth-backdrop__orb--peach" />
          <div className="synth-backdrop__dock">
            <span />
            <span />
            <span />
            <span className="is-active" />
          </div>
          <div className="synth-backdrop__doc">
            <div className="synth-backdrop__doc-eyebrow">Documentation</div>
            <div className="synth-backdrop__doc-title">Frame tasks with context, notes and decisions.</div>
            <div className="synth-backdrop__doc-line is-long" />
            <div className="synth-backdrop__doc-line is-mid" />
            <div className="synth-backdrop__doc-line is-short" />
          </div>
          <div className="synth-backdrop__canvas">
            <div className="synth-backdrop__grid" />
            <div className="synth-backdrop__sticky" />
            <div className="synth-backdrop__note" />
            <div className="synth-backdrop__chart">
              {levels.slice(0, 4).map((level, index) => (
                <span
                  key={index}
                  style={{
                    '--bar-level': level.toFixed(3),
                  }}
                />
              ))}
            </div>
            <div className="synth-backdrop__selection" />
          </div>
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

      {open && supportsAudioReactive ? (
        <div className="modal-backdrop audio-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose?.()}>
          <div
            className="audio-modal fade-in"
            style={{
              '--audio-energy': metrics.overall.toFixed(3),
              '--audio-bass': metrics.bass.toFixed(3),
              '--audio-mid': metrics.mid.toFixed(3),
              '--audio-treble': metrics.treble.toFixed(3),
            }}
          >
            <div className="audio-modal__header">
              <div>
                <span className="audio-modal__eyebrow">Synth reactive background</span>
                <h2 className="audio-modal__title">Audio capture control room</h2>
              </div>

              <div className="audio-modal__header-actions">
                <span className={`audio-modal__badge audio-modal__badge--${captureState}`}>{STATUS_LABELS[captureState]}</span>
                <button type="button" className="audio-modal__close" onClick={onClose} aria-label="Fechar modal de audio">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="audio-modal__body">
              <section className="audio-modal__doc-panel">
                <div className="audio-modal__section-head">
                  <Music4 size={16} />
                  <div>
                    <strong>How to capture</strong>
                    <p>Escolha a origem pensando no tipo de audio que voce quer puxar para o fundo.</p>
                  </div>
                </div>

                <div className="audio-modal__mode-grid">
                  {CAPTURE_MODES.map((mode) => {
                    const active = mode.id === captureMode
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        className={`audio-modal__mode-card${active ? ' is-active' : ''}`}
                        onClick={() => setCaptureMode(mode.id)}
                      >
                        <span className="audio-modal__mode-chip">{mode.label}</span>
                        <strong>{mode.title}</strong>
                        <p>{mode.description}</p>
                      </button>
                    )
                  })}
                </div>

                <div className="audio-modal__tips">
                  <div className="audio-modal__tip">
                    <MonitorUp size={14} />
                    <span>{CAPTURE_MODES.find((item) => item.id === captureMode)?.helper}</span>
                  </div>
                  <div className="audio-modal__tip">
                    <Sparkles size={14} />
                    <span>Se o navegador devolver video sem audio, troque a origem ou tente Chrome / Edge.</span>
                  </div>
                </div>
              </section>

              <section className="audio-modal__board-panel">
                <div className="audio-modal__preview">
                  <div className="audio-modal__preview-grid" />
                  <div className="audio-modal__preview-pulse" />
                  <div className="audio-modal__preview-bars">
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

                <div className="audio-modal__controls">
                  <button type="button" onClick={startCapture} className="cyber-btn audio-modal__primary">
                    {captureState === 'live' ? 'Desativar reatividade' : 'Iniciar captura de audio'}
                  </button>

                  <button
                    type="button"
                    onClick={() => stopCapture({ state: 'idle', message: defaultHint, nextTone: tone })}
                    className="audio-modal__ghost"
                    disabled={captureState !== 'live' && captureState !== 'requesting'}
                  >
                    Parar captura
                  </button>
                </div>

                <p className="audio-modal__hint">{hint}</p>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
