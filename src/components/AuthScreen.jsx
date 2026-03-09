import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../contexts/ThemeContext'
import { THEMES } from '../themes'

export default function AuthScreen() {
  const { theme } = useTheme()
  const t = THEMES[theme]
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (error) throw error
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const headingFont = t?.vars['--font-heading'] || "'Orbitron', sans-serif"

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-dark)', padding: '24px', position: 'relative',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: headingFont,
            fontSize: '32px', fontWeight: 900,
            color: '#fff', letterSpacing: '4px',
            textShadow: '0 0 20px var(--neon-cyan)',
          }}>
            KANBAN_NINE
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '3px', marginTop: 6 }}>
            {mode === 'login' ? 'ACESSO AO SISTEMA' : 'REGISTRO DE OPERADOR'}
          </p>
        </div>

        {/* Card */}
        <div className="cyber-card" style={{ background: 'var(--panel-bg)', padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>Nome / Codinome</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="cyber-input" style={inputStyle}
                  placeholder="Neo, Trinity, Morpheus..."
                />
              </div>
            )}
            <div>
              <label style={labelStyle}>E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="cyber-input" style={inputStyle}
                placeholder="operador@sistema.io" required
              />
            </div>
            <div>
              <label style={labelStyle}>Senha</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="cyber-input" style={inputStyle}
                placeholder="••••••••" required
              />
            </div>

            {error && (
              <p style={{ color: 'var(--neon-pink)', fontSize: '12px', fontFamily: 'var(--font-body)', background: 'rgba(255,0,255,0.08)', padding: '8px 12px', border: '1px solid rgba(255,0,255,0.3)' }}>
                ⚠ {error}
              </p>
            )}
            {success && (
              <p style={{ color: 'var(--neon-green)', fontSize: '12px', fontFamily: 'var(--font-body)', background: 'rgba(0,255,136,0.08)', padding: '8px 12px', border: '1px solid rgba(0,255,136,0.3)' }}>
                ✓ {success}
              </p>
            )}

            <button
              type="submit"
              className="cyber-btn"
              style={{ padding: '12px', fontSize: '13px', marginTop: 8, background: loading ? 'rgba(0,243,255,0.1)' : undefined }}
              disabled={loading}
            >
              {loading ? 'AGUARDE...' : mode === 'login' ? 'ACESSAR SISTEMA' : 'REGISTRAR'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '12px', fontFamily: 'var(--font-body)' }}
            >
              {mode === 'login' ? 'Não tem conta? Registre-se' : 'Já tem conta? Fazer login'}
            </button>
          </div>
        </div>

        {/* Theme quick-select */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
          {Object.values(THEMES).map(th => (
            <button
              key={th.id}
              onClick={() => {
                import('../themes').then(m => m.applyTheme(th.id))
                localStorage.setItem('cyberdaily-theme', th.id)
              }}
              style={{
                background: 'none', border: '1px solid #333', cursor: 'pointer',
                color: '#555', fontSize: '11px', padding: '4px 10px',
                fontFamily: 'monospace',
              }}
              title={th.label}
            >
              {th.icon} {th.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '10px', color: 'var(--neon-cyan)',
  fontFamily: 'var(--font-body)', textTransform: 'uppercase',
  letterSpacing: '2px', marginBottom: 6,
}
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '2px',
  fontFamily: 'var(--font-body)', fontSize: '13px',
}
