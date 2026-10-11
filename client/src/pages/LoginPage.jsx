import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage.jsx'
import { getApiErrorMessage } from '../services/api.js'
import { login } from '../services/authService.js'

function LoginPage({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const session = await login({ email, password })
      onAuthenticated(session)
      navigate('/')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <h1>Resolve</h1>
      <h2>Log in</h2>
      <form className="form-stack" onSubmit={handleSubmit}>
        <ErrorMessage message={error} />
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p>Need an account? <Link to="/register">Register</Link></p>
    </section>
  )
}

export default LoginPage
