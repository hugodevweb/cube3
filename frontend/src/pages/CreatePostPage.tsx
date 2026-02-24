import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { communauteApi } from '../api/communaute';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const post = await communauteApi.createPost({ title: title.trim(), content: content.trim() });
      navigate(`/community/${post.id}`);
    } catch {
      setError('Impossible de publier la discussion. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', background: 'var(--ink)' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <nav style={breadcrumb} aria-label="Fil d'Ariane">
          <Link to="/community" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Communauté</Link>
          <span style={{ color: 'var(--bone-dim)', margin: '0 0.5rem' }}>›</span>
          <span style={{ color: 'var(--bone-dim)' }}>Nouvelle discussion</span>
        </nav>

        <h1 style={pageTitle}>Nouvelle discussion</h1>

        <form onSubmit={handleSubmit} style={form}>
          <div style={field}>
            <label htmlFor="post-title" style={label}>Titre</label>
            <input
              id="post-title"
              type="text"
              required
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Un titre accrocheur…"
              style={input}
              disabled={submitting}
            />
            <span style={charCount}>{title.length}/255</span>
          </div>

          <div style={field}>
            <label htmlFor="post-content" style={label}>Contenu</label>
            <textarea
              id="post-content"
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partagez vos pensées…"
              style={{ ...input, resize: 'vertical', lineHeight: 1.7 }}
              disabled={submitting}
            />
          </div>

          {error && (
            <p role="alert" style={errorMsg}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Link to="/community" className="btn-ghost" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Annuler
            </Link>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !title.trim() || !content.trim()}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'Publication…' : 'Publier'}
            </button>
          </div>
        </form>
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
const pageTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.8rem',
  letterSpacing: '0.06em',
  color: 'var(--bone)',
  marginBottom: '2rem',
};
const form: React.CSSProperties = {
  background: 'var(--ink-light)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius)',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};
const field: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};
const label: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.65rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--bone-dim)',
};
const input: React.CSSProperties = {
  background: 'var(--ash)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--bone)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  padding: '0.7rem 0.85rem',
  outline: 'none',
  width: '100%',
};
const charCount: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.6rem',
  color: 'var(--bone-dim)',
  alignSelf: 'flex-end',
};
const errorMsg: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  color: 'var(--blood-bright)',
  padding: '0.6rem 0.85rem',
  background: 'rgba(139,0,0,0.12)',
  border: '1px solid var(--blood)',
  borderRadius: 'var(--radius-sm)',
};
