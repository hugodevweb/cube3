import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { communauteApi, type Post } from '../api/communaute';
import { useAuth } from '../auth/AuthContext';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins} minute${mins !== 1 ? 's' : ''}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} heure${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} jour${days !== 1 ? 's' : ''}`;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    communauteApi
      .getPosts()
      .then(setPosts)
      .catch(() => setError('Impossible de charger les discussions.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="section" style={{ paddingTop: '6rem', minHeight: '100vh', background: 'var(--ink-light)' }}>
      <div className="container">
        <div className="section-header">
          <h1 className="display-lg">Communauté</h1>
          <div className="section-rule" aria-hidden="true" />
          {user && (
            <Link to="/community/new" className="btn-sm" style={{ width: 'auto', padding: '0.5rem 1.2rem', whiteSpace: 'nowrap' }}>
              + Nouveau fil
            </Link>
          )}
        </div>

        {loading && <p style={stateMsg}>Chargement…</p>}
        {error && <p style={{ ...stateMsg, color: 'var(--blood-bright)' }}>{error}</p>}

        {!loading && !error && posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ ...stateMsg, padding: 0, marginBottom: '1.5rem' }}>
              Aucune discussion pour l'instant. Soyez le premier !
            </p>
            {user && (
              <Link to="/community/new" className="btn-primary">
                Créer une discussion
              </Link>
            )}
          </div>
        )}

        {posts.length > 0 && (
          <div className="community-list">
            {posts.map((post, i) => (
              <article
                key={post.id}
                className={`thread-card animate-in animate-in-${Math.min(i + 1, 6)}`}
                aria-label={post.title}
              >
                <div className="thread-main">
                  <h3 className="thread-title">
                    <Link to={`/community/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {post.title}
                    </Link>
                  </h3>
                  <p className="thread-excerpt">
                    {post.content.length > 180 ? post.content.slice(0, 180) + '…' : post.content}
                  </p>
                  <div className="thread-foot">
                    <span className="thread-author">
                      Par {post.authorId === user?.sub ? 'Vous' : post.authorId.slice(0, 8)}
                    </span>
                    <div className="thread-stats">
                      <span className="thread-stat">
                        <strong>{post.comments?.length ?? 0}</strong> réponses
                      </span>
                      <span className="thread-stat">
                        <strong>{post.likes?.length ?? 0}</strong> ♥
                      </span>
                      <span className="thread-stat">{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="thread-side">
                  <Link to={`/community/${post.id}`} className="btn-outline-sm">
                    Lire
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const stateMsg: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--bone-dim)',
  padding: '3rem 0',
  textAlign: 'center',
};
