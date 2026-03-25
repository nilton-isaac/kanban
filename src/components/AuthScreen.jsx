import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../contexts/ThemeContext'
import { THEMES } from '../themes'
import ThemeSwitcher from './ThemeSwitcher'

export default function AuthScreen() {
  const { theme } = useTheme()
  const currentTheme = THEMES[theme] || THEMES.dark
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (signUpError) throw signUpError
        setSuccess('Conta criada. Verifique seu e-mail para confirmar o acesso.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--bg-gradient)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="auth-orb auth-orb--cyan" />
      <div className="auth-orb auth-orb--violet" />

      <div style={{ width: 'min(100%, 460px)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28, display: 'grid', gap: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--text-muted)',
            }}
          >
            Synth KV Sign In
          </span>
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: currentTheme.vars['--font-heading'],
                fontSize: 'clamp(32px, 6vw, 48px)',
                lineHeight: 0.94,
                letterSpacing: '-0.06em',
                color: 'var(--text-primary)',
              }}
            >
              Synth Kanban
            </h1>
            <p
              style={{
                marginTop: 10,
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Workspace de entrega com glass layers e glow central
            </p>
          </div>
        </div>

        <div className="cyber-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {['login', 'signup'].map((item) => {
              const active = mode === item
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMode(item)
                    setError('')
                    setSuccess('')
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 14,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg, color-mix(in srgb, var(--brand-cyan) 16%, transparent), color-mix(in srgb, var(--brand-violet) 18%, transparent))' : 'var(--surface-soft)',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {item === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="cyber-input"
                  style={inputStyle}
                  placeholder="Seu nome de workspace"
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="cyber-input"
                style={inputStyle}
                placeholder="time@workspace.com"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="cyber-input"
                style={inputStyle}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p
                style={{
                  margin: 0,
                  color: 'var(--neon-orange)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-body)',
                  background: 'color-mix(in srgb, var(--neon-orange) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--neon-orange) 28%, transparent)',
                  padding: '10px 12px',
                  borderRadius: 14,
                }}
              >
                {error}
              </p>
            )}

            {success && (
              <p
                style={{
                  margin: 0,
                  color: 'var(--neon-green)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-body)',
                  background: 'color-mix(in srgb, var(--neon-green) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--neon-green) 28%, transparent)',
                  padding: '10px 12px',
                  borderRadius: 14,
                }}
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              className="cyber-btn"
              style={{
                padding: '13px 16px',
                marginTop: 6,
                fontSize: '12px',
                justifyContent: 'center',
                background: loading ? 'var(--surface-soft)' : undefined,
              }}
              disabled={loading}
            >
              {loading ? 'Processando...' : mode === 'login' ? 'Acessar workspace' : 'Criar workspace'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 18, display: 'grid', justifyItems: 'center', gap: 10 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Synth temas principais + colecao completa
          </p>
          <ThemeSwitcher align="center" />
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-body)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  marginBottom: 8,
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
}
