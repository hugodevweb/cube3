import { useState } from 'react';

interface MediaItem {
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

const MEDIA_ITEMS: MediaItem[] = [
  {
    id: 1,
    title: 'Festival 2023 — Meilleur Court Métrage',
    description:
      '« Sous les Lattes » de Clara Méjean. Palme du jury au 10e Festival Annuel de l\'Épouvante. 24 minutes de tension pure.',
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
      'Première production originale du collectif Evil Ed. Une creature feature en huis clos tournée dans les Pyrénées. 52 minutes.',
    category: 'Original',
    type: 'Série',
    duration: '52 min',
    year: '2024',
    icon: '📽️',
    gradient: 'linear-gradient(135deg, #060f1a 0%, #0a1a2d 100%)',
  },
  {
    id: 3,
    title: 'Masterclass — L\'Art de la Mise en Scène Horrifique',
    description:
      'Avec le réalisateur Marc Dubois. Décorticage de séquences cultes, gestion de la tension, sound design. 90 minutes.',
    category: 'Masterclass',
    type: 'Éducatif',
    duration: '1h 32 min',
    year: '2024',
    icon: '🎥',
    gradient: 'linear-gradient(135deg, #0d0d0d 0%, #1a1205 100%)',
  },
  {
    id: 4,
    title: 'Festival 2024 — Sélection Officielle',
    description:
      '12 courts métrages en compétition issus de 8 pays. Horreur psychologique, body horror, folk horror — toutes les nuances de la peur.',
    category: 'Festival',
    type: 'Court Métrage',
    duration: 'Varie',
    year: '2024',
    icon: '🏆',
    gradient: 'linear-gradient(135deg, #1a0a00 0%, #2d1a05 100%)',
  },
  {
    id: 5,
    title: 'Evil Ed Collection — Épisode 02',
    description:
      'Suite de la série originale. La créature se rapproche du village. Le huis clos se resserre.',
    category: 'Original',
    type: 'Série',
    duration: '48 min',
    year: '2024',
    icon: '👁️',
    gradient: 'linear-gradient(135deg, #06010a 0%, #1a0a2d 100%)',
  },
  {
    id: 6,
    title: 'Documentaire — Les Maîtres du Giallo',
    description:
      'Entretiens exclusifs avec les héritiers de la tradition Giallo italienne. Musique, couleur, violence stylisée.',
    category: 'Documentaire',
    type: 'Éducatif',
    duration: '1h 10 min',
    year: '2023',
    icon: '🎞️',
    gradient: 'linear-gradient(135deg, #1a0505 0%, #0d0d0d 100%)',
  },
];

const CATEGORIES = ['Tout', 'Festival', 'Original', 'Masterclass', 'Documentaire'];

export default function MediaPage() {
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [playing, setPlaying] = useState<number | null>(null);

  const filtered =
    activeCategory === 'Tout'
      ? MEDIA_ITEMS
      : MEDIA_ITEMS.filter((m) => m.category === activeCategory);

  return (
    <div className="section" style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <div className="container">
        <div className="section-header">
          <h1 className="display-lg">Streaming</h1>
          <div className="section-rule" aria-hidden="true" />
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? 'btn-sm' : 'btn-outline-sm'}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Player overlay */}
        {playing !== null && (
          <div style={playerOverlay} onClick={() => setPlaying(null)} role="dialog" aria-modal="true" aria-label="Lecteur">
            <div style={playerBox} onClick={(e) => e.stopPropagation()}>
              {(() => {
                const item = MEDIA_ITEMS.find((m) => m.id === playing)!;
                return (
                  <>
                    <div style={{ ...item && { background: item.gradient }, height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius) var(--radius) 0 0', fontSize: '5rem' }}>
                      {item.icon}
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blood-bright)', marginBottom: '0.5rem' }}>
                        {item.category} · {item.year} · {item.duration}
                      </p>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--bone)', marginBottom: '0.75rem' }}>{item.title}</h2>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--bone-dim)', lineHeight: 1.6 }}>{item.description}</p>
                      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--ash)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>
                          Lecteur vidéo — Disponible prochainement
                        </p>
                      </div>
                      <button onClick={() => setPlaying(null)} style={{ marginTop: '1rem', width: '100%', background: 'transparent', border: '1px solid var(--ash-mid)', color: 'var(--bone-dim)', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                        Fermer
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{ padding: '0 0' }}>
          <div className="streaming-grid">
            {filtered.map((item, i) => (
              <article
                key={item.id}
                className={`stream-card animate-in animate-in-${Math.min(i + 1, 6)}`}
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
                    <button
                      className="btn-sm"
                      type="button"
                      style={{ width: 'auto', padding: '0.5rem 1.2rem' }}
                      onClick={() => setPlaying(item.id)}
                    >
                      Regarder
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const playerOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const playerBox: React.CSSProperties = {
  background: 'var(--ink-light)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius)',
  width: '100%',
  maxWidth: '540px',
  overflow: 'hidden',
};
