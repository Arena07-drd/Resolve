import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage.jsx'
import { getApiErrorMessage } from '../services/api.js'
import { register } from '../services/authService.js'

function RegisterPage({ onAuthenticated }) {
  const [name, setName] = useState('')
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
      const session = await register({ name, email, password })
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
      <h2>Register</h2>
      <form className="form-stack" onSubmit={handleSubmit}>
        <ErrorMessage message={error} />
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required minLength="2" /></label>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="8" /></label>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </section>
  )
}

export default RegisterPage
