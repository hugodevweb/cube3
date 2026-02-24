import { Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth, isAdmin } from './auth/AuthContext';
import { useCart } from './context/CartContext';
import LoginPage from './pages/LoginPage';
import CataloguePage from './pages/CataloguePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import CommunityPage from './pages/CommunityPage';
import PostDetailPage from './pages/PostDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import MediaPage from './pages/MediaPage';
import AdminPage from './pages/AdminPage';

/* ─── Types ──────────────────────────────────────────────────── */
interface StreamItem {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  duration: string;
  year: string;
  icon: string;
  gradient: string;
}

/* ─── Static showcase data (Home page only) ──────────────────── */
const SHOWCASE_STREAMS: StreamItem[] = [
  {
    id: 1,
    title: 'Festival 2023 — Meilleur Court Métrage',
    description:
      '« Sous les Lattes » de Clara Méjean. Palme du jury au 10e Festival Annuel de l\'Épouvante.',
    category: 'Festival',
    type: 'Court Métrage',
    duration: '24 min',
    year: '2023',
    icon: '🎬',
    gradient: 'linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%)',
  },
  {
    id: 2,
    title: 'Evil Ed Collection — Épisode 01',
    description:
      'Première production originale du collectif Evil Ed. Une creature feature en huis clos.',
    category: 'Original',
    type: 'Série',
    duration: '52 min',
    year: '2024',
    icon: '📽️',
    gradient: 'linear-gradient(135deg, #060f1a 0%, #0a1a2d 100%)',
  },
  {
    id: 3,
    title: 'Masterclass — L\'Art de la Mise en Scène',
    description:
      'Avec le réalisateur Marc Dubois. Décorticage de séquences cultes et gestion de la tension.',
    category: 'Masterclass',
    type: 'Éducatif',
    duration: '1h 32 min',
    year: '2024',
    icon: '🎥',
    gradient: 'linear-gradient(135deg, #0d0d0d 0%, #1a1205 100%)',
  },
];

/* ─── Components ─────────────────────────────────────────────── */

function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo" aria-label="Accueil">
        La Petite Maison
        <span>de l'épouvante</span>
      </Link>
      <nav aria-label="Navigation principale">
        <ul className="navbar-nav">
          <li><Link to="/catalogue">Boutique</Link></li>
          <li><Link to="/community">Communauté</Link></li>
          <li><Link to="/media">Streaming</Link></li>
          {isAdmin(user) && <li><Link to="/admin">Admin</Link></li>}
        </ul>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link
          to="/cart"
          style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--bone)', textDecoration: 'none', position: 'relative' }}
          aria-label={`Panier (${count} article${count !== 1 ? 's' : ''})`}
        >
          🛒
          {count > 0 && (
            <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: 'var(--blood)', color: 'var(--bone)', borderRadius: '50%', fontSize: '0.55rem', width: '1.2em', height: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)' }}>
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Link>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--bone-dim)', textTransform: 'uppercase' }}>
              {user.preferred_username ?? user.email ?? user.sub.slice(0, 8)}
            </span>
            <button className="navbar-cta" type="button" onClick={logout}>
              Se déconnecter
            </button>
          </div>
        ) : (
          <Link to="/login" className="navbar-cta">Se connecter</Link>
        )}
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-bg" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-eyebrow" aria-hidden="true">
          <span className="hero-eyebrow-line" />
          <span className="hero-eyebrow-text">Depuis 2014 — Paris · Londres</span>
        </div>

        <h1 className="display-xl hero-title" id="hero-title">
          La Petite<br />
          Maison de<br />
          <em>l'Épouvante</em>
        </h1>

        <p className="body-lg hero-subtitle">
          Horreur, fantasy & héroïc fantasy — une communauté de passionnés,
          une boutique de collectionneurs, un festival qui ne s'éteint jamais.
        </p>

        <div className="hero-actions">
          <Link to="/catalogue" className="btn-primary">Explorer la boutique</Link>
          <Link to="/media" className="btn-ghost">Voir les films</Link>
        </div>
      </div>

      <div className="hero-scroll-hint" aria-hidden="true">
        <span>Défiler</span>
        <div className="scroll-arrow" />
      </div>
    </section>
  );
}

function BoutiqueShowcase() {
  return (
    <section className="section" id="boutique" aria-labelledby="boutique-title">
      <div className="container">
        <div className="section-header">
          <h2 className="display-lg" id="boutique-title">Boutique</h2>
          <div className="section-rule" aria-hidden="true" />
          <Link to="/catalogue" className="label text-dim" style={{ whiteSpace: 'nowrap' }}>
            Tout voir →
          </Link>
        </div>
      </div>

      <div style={{ padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {([
            { icon: '🎬', label: 'Films', desc: 'Coffrets Blu-ray, éditions collector' },
            { icon: '📚', label: 'BD & Fanzines', desc: 'Bandes dessinées et publications indépendantes' },
            { icon: '🎭', label: 'Goodies', desc: 'Figurines, vinyles, objets de collection' },
          ] as const).map((cat) => (
            <Link
              key={cat.label}
              to={`/catalogue`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{ background: 'var(--ink-light)', border: '1px solid var(--ash-mid)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', transition: 'border-color var(--transition)' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>{cat.icon}</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone)', marginBottom: '0.5rem' }}>{cat.label}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--bone-dim)' }}>{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommunauteShowcase() {
  return (
    <section
      className="section"
      id="communaute"
      aria-labelledby="communaute-title"
      style={{ background: 'var(--ink-light)' }}
    >
      <div className="container">
        <div className="section-header">
          <h2 className="display-lg" id="communaute-title">Communauté</h2>
          <div className="section-rule" aria-hidden="true" />
          <Link to="/community" className="label text-dim" style={{ whiteSpace: 'nowrap' }}>
            Forum complet →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'var(--bone-dim)', lineHeight: 1.75, marginBottom: '1.5rem' }}>
              Rejoignez des milliers de passionnés d'horreur, de fantasy et d'héroïc fantasy.
              Partagez vos découvertes, organisez des échanges, participez aux discussions du festival.
            </p>
            <Link to="/community" className="btn-ghost" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Rejoindre la communauté
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: '💬', label: 'Discussions', desc: 'Films, livres, jeux — tout y passe' },
              { icon: '🔄', label: 'Échanges', desc: 'Troquez vos collections entre membres' },
              { icon: '🏆', label: 'Festival', desc: 'Participez aux votes et aux sélections' },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone)', marginBottom: '0.2rem' }}>{f.label}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--bone-dim)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StreamingShowcase() {
  return (
    <section className="section" id="streaming" aria-labelledby="streaming-title">
      <div className="container">
        <div className="section-header">
          <h2 className="display-lg" id="streaming-title">Streaming</h2>
          <div className="section-rule" aria-hidden="true" />
          <Link to="/media" className="label text-dim" style={{ whiteSpace: 'nowrap' }}>
            Tout visionner →
          </Link>
        </div>
      </div>

      <div style={{ padding: '0 2rem' }}>
        <div className="streaming-grid">
          {SHOWCASE_STREAMS.map((item, i) => (
            <article
              key={item.id}
              className={`stream-card animate-in animate-in-${Math.min(i + 1, 3)}`}
              aria-label={item.title}
            >
              <div className="stream-thumbnail">
                <div
                  className="stream-thumb-bg"
                  style={{ background: item.gradient }}
                  aria-hidden="true"
                >
                  <span style={{ fontSize: '4rem', filter: 'grayscale(20%)' }}>
                    {item.icon}
                  </span>
                </div>
                <div className="stream-play-overlay" aria-hidden="true">
                  <div className="play-btn">
                    <div className="play-icon" />
                  </div>
                </div>
                <span className="stream-type-badge">{item.type}</span>
                <span className="stream-duration">{item.duration}</span>
              </div>

              <div className="stream-body">
                <span className="stream-category">{item.category}</span>
                <h3 className="stream-title">{item.title}</h3>
                <p className="stream-desc">{item.description}</p>
                <div className="stream-meta">
                  <span className="stream-year">{item.year}</span>
                  <Link to="/media" className="btn-sm" style={{ width: 'auto', padding: '0.5rem 1.2rem', textDecoration: 'none', display: 'inline-block' }}>
                    Regarder
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" aria-label="Pied de page">
      <div className="footer-inner">
        <div>
          <div className="footer-brand-name">La Petite Maison de l'Épouvante</div>
          <p className="footer-brand-tagline">
            Depuis 2014, nous cultivons la passion de l'horreur, de la fantasy
            et de l'héroïc fantasy. Paris & Londres.
          </p>
        </div>

        <nav aria-label="Liens boutique">
          <div className="footer-col-title">Boutique</div>
          <ul className="footer-links">
            <li><Link to="/catalogue">Films & Blu-ray</Link></li>
            <li><Link to="/catalogue">BD & Fanzines</Link></li>
            <li><Link to="/catalogue">Goodies</Link></li>
            <li><Link to="/orders">Mes commandes</Link></li>
          </ul>
        </nav>

        <nav aria-label="Liens utiles">
          <div className="footer-col-title">Explorer</div>
          <ul className="footer-links">
            <li><Link to="/community">Forum Communauté</Link></li>
            <li><Link to="/media">Streaming & Festival</Link></li>
            <li><Link to="/media">Evil Ed Collection</Link></li>
            <li><Link to="/community">Échanges entre membres</Link></li>
          </ul>
        </nav>
      </div>

      <div className="footer-bottom">
        <span className="footer-legal">
          © 2024 La Petite Maison de l'Épouvante — Tous droits réservés
        </span>
        <span className="footer-made">
          Fait avec passion & quelques nuits sans sommeil
        </span>
      </div>
    </footer>
  );
}

/* ─── Pages ──────────────────────────────────────────────────── */
function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BoutiqueShowcase />
        <CommunauteShowcase />
        <StreamingShowcase />
      </main>
      <Footer />
    </>
  );
}

function PageLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

/* ─── Protected Route ────────────────────────────────────────── */
function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/* ─── App ────────────────────────────────────────────────────── */
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route element={<PageLayout />}>
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/catalogue/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/new" element={<CreatePostPage />} />
          <Route path="/community/:id" element={<PostDetailPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
