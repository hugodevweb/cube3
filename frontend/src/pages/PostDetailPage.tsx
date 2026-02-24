import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { communauteApi, type Post } from '../api/communaute';
import { useAuth, isAdmin } from '../auth/AuthContext';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    communauteApi
      .getPost(id)
      .then((p) => {
        setPost(p);
        setLikeCount(p.likes?.length ?? 0);
        setLiked(!!user && p.likes?.some((l) => l.userId === user.sub));
      })
      .catch(() => setError('Discussion introuvable.'))
      .finally(() => setLoading(false));
  }, [id, user]);

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!id || !comment.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await communauteApi.addComment(id, comment.trim());
      setPost((prev) =>
        prev ? { ...prev, comments: [...(prev.comments ?? []), newComment] } : prev,
      );
      setComment('');
    } catch {
      // silently ignore
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike() {
    if (!id) return;
    try {
      const res = await communauteApi.toggleLike(id);
      setLiked(res.liked);
      setLikeCount((c) => (res.liked ? c + 1 : c - 1));
    } catch {
      // silently ignore
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Supprimer cette discussion ?')) return;
    try {
      await communauteApi.deletePost(id);
      navigate('/community');
    } catch {
      // silently ignore
    }
  }

  const canDelete = user && post && (user.sub === post.authorId || isAdmin(user));

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', background: 'var(--ink)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <nav style={breadcrumb} aria-label="Fil d'Ariane">
          <Link to="/community" style={crumbLink}>Communauté</Link>
          <span style={{ color: 'var(--bone-dim)', margin: '0 0.5rem' }}>›</span>
          <span style={{ color: 'var(--bone-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post?.title ?? '…'}
          </span>
        </nav>

        {loading && <p style={stateMsg}>Chargement…</p>}
        {error && <p style={{ ...stateMsg, color: 'var(--blood-bright)' }}>{error}</p>}

        {post && (
          <>
            {/* Post body */}
            <article style={postCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <h1 style={postTitle}>{post.title}</h1>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {canDelete && (
                    <button onClick={handleDelete} style={dangerBtn} aria-label="Supprimer">
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--bone-dim)', margin: '0.5rem 0 1.5rem' }}>
                Par {post.authorId === user?.sub ? 'Vous' : post.authorId.slice(0, 8)} · {timeAgo(post.createdAt)}
              </p>
              <p style={postContent}>{post.content}</p>

              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={handleLike}
                  style={{ ...likeBtn, color: liked ? 'var(--blood-bright)' : 'var(--bone-dim)' }}
                  aria-pressed={liked}
                >
                  ♥ {likeCount}
                </button>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--bone-dim)' }}>
                  {post.comments?.length ?? 0} commentaire{(post.comments?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </article>

            {/* Comments */}
            <section style={{ marginTop: '2rem' }}>
              <h2 style={sectionTitle}>Commentaires</h2>

              {(!post.comments || post.comments.length === 0) && (
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--bone-dim)', padding: '1.5rem 0' }}>
                  Aucun commentaire. Soyez le premier à réagir.
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '2rem' }}>
                {post.comments?.map((c) => (
                  <div key={c.id} style={commentRow}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--bone-dim)', marginBottom: '0.4rem' }}>
                      {c.authorId === user?.sub ? 'Vous' : c.authorId.slice(0, 8)} · {timeAgo(c.createdAt)}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--bone)', lineHeight: 1.6 }}>
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Comment form */}
              <form onSubmit={handleComment} style={commentForm}>
                <h3 style={sectionTitle}>Répondre</h3>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Votre commentaire…"
                  rows={4}
                  required
                  style={textarea}
                  disabled={submitting}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ alignSelf: 'flex-end' }}
                  disabled={submitting || !comment.trim()}
                >
                  {submitting ? 'Envoi…' : 'Publier'}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const breadcrumb: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'var(--font-display)',
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '2rem',
};
const crumbLink: React.CSSProperties = { color: 'var(--gold)', textDecoration: 'none' };
const postCard: React.CSSProperties = {
  background: 'var(--ink-light)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius)',
  padding: '2rem',
};
const postTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.5rem',
  letterSpacing: '0.04em',
  color: 'var(--bone)',
  lineHeight: 1.25,
};
const postContent: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '1.05rem',
  color: 'var(--bone)',
  lineHeight: 1.75,
  whiteSpace: 'pre-wrap',
};
const likeBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  fontSize: '0.8rem',
  letterSpacing: '0.08em',
  padding: '0.3rem 0.7rem',
  transition: 'color var(--transition)',
};
const dangerBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--blood)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--blood-bright)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '0.35rem 0.7rem',
};
const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.75rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--bone-dim)',
  marginBottom: '1rem',
};
const commentRow: React.CSSProperties = {
  padding: '1rem 0',
  borderBottom: '1px solid var(--ash)',
};
const commentForm: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  background: 'var(--ink-light)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius)',
  padding: '1.5rem',
};
const textarea: React.CSSProperties = {
  background: 'var(--ash)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--bone)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  lineHeight: 1.6,
  padding: '0.75rem',
  resize: 'vertical',
  outline: 'none',
};
const stateMsg: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--bone-dim)',
  padding: '3rem 0',
  textAlign: 'center',
};
