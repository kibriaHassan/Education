import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useCatalog } from '../catalog'
import { useTheme } from '../theme'

const links = [
  { to: '/book', label: 'গণিত বই' },
  { to: '/solutions', label: 'সমাধান' },
  { to: '/mcq', label: 'MCQ' },
  { to: '/cq', label: 'সৃজনশীল' },
  { to: '/generator', label: 'জেনারেটর' },
]

export function Layout() {
  const { source } = useCatalog()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div className="app-shell">
      <a className="skip" href="#main">
        মূল অংশে যাও
      </a>
      <header className="nav">
        <div className="wrap nav-inner">
          <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              অ
            </span>
            <span>
              <strong>অঙ্কশালা</strong>
              <small>নবম–দশম গণিত</small>
            </span>
          </NavLink>
          <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="প্রধান">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <button type="button" className="icon-btn" onClick={toggle} aria-label="থিম বদলাও">
              {theme === 'dark' ? 'আলো' : 'আঁধার'}
            </button>
            <button
              type="button"
              className="icon-btn nav-toggle"
              aria-expanded={open}
              aria-label="মেনু"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? 'বন্ধ' : 'মেনু'}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="wrap footer-grid">
          <div>
            <strong>অঙ্কশালা</strong>
            <p>নবম–দশম শ্রেণির গণিত পড়ার জায়গা। পড়তে লগইন লাগে না।</p>
            <NavLink to="/admin">অ্যাডমিন প্যানেল</NavLink>
          </div>
          <p className="footer-note">
            এখানকার পাঠ, সমাধান, MCQ ও সৃজনশীল প্রশ্ন অঙ্কশালার নিজস্ব উপাদান। অধ্যায়ের নাম এনসিটিবির নবম–দশম গণিতের
            ধারা অনুসরণ করে। {source === 'mongodb' ? 'এখন পাঠ MongoDB থেকে আসছে।' : 'MongoDB যুক্ত না থাকলে এই সাইটের নিজের পাঠ দেখায়।'}
          </p>
        </div>
      </footer>
    </div>
  )
}
