import { Link, NavLink, Outlet } from 'react-router-dom'

function AppLayout({ user, onLogout }) {
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">Resolve</Link>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/tickets" end>Tickets</NavLink>
          <NavLink to="/tickets/new">New ticket</NavLink>
        </nav>
        <div className="account-actions">
          <span>{user?.name}</span>
          <button className="link-button" type="button" onClick={onLogout}>Log out</button>
        </div>
      </header>
      <main className="page-content"><Outlet context={{ user }} /></main>
    </>
  )
}

export default AppLayout
