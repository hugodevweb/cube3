import { useState, useEffect, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, isAdmin } from '../auth/AuthContext';
import { venteApi, type Product, type ProductType } from '../api/vente';

type Tab = 'products';

const TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'film', label: 'Film' },
  { value: 'bd', label: 'BD' },
  { value: 'goodie', label: 'Goodie' },
];

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  type: 'goodie' as ProductType,
};

export default function AdminPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAdmin(user)) return <Navigate to="/" replace />;

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [tab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  function loadProducts() {
    setLoadingProducts(true);
    venteApi
      .getProducts()
      .then(setProducts)
      .catch(() => setError('Impossible de charger les produits.'))
      .finally(() => setLoadingProducts(false));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      stock: String(product.stock),
      type: product.type,
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await venteApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Impossible de supprimer le produit.');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      type: form.type,
      metadata: {},
    };
    try {
      if (editing) {
        const updated = await venteApi.updateProduct(editing.id, data);
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
      } else {
        const created = await venteApi.createProduct(data as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        setProducts((prev) => [created, ...prev]);
      }
      setShowForm(false);
    } catch {
      setFormError('Impossible de sauvegarder. Vérifiez les champs.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', background: 'var(--ink)' }}>
      <div className="container">
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <h1 className="display-lg">Administration</h1>
          <div className="section-rule" aria-hidden="true" />
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--ash-mid)', paddingBottom: '1rem' }}>
          <button className={tab === 'products' ? 'btn-sm' : 'btn-outline-sm'}>
            Produits
          </button>
        </div>

        {/* Products tab */}
        {tab === 'products' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={sectionHeading}>Gestion des produits</h2>
              <button className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.2rem' }} onClick={openCreate}>
                + Ajouter
              </button>
            </div>

            {error && <p style={errorMsg}>{error}</p>}
            {loadingProducts && <p style={stateMsg}>Chargement…</p>}

            {!loadingProducts && products.length === 0 && (
              <p style={stateMsg}>Aucun produit.</p>
            )}

            {products.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={table}>
                  <thead>
                    <tr>
                      {['Nom', 'Type', 'Prix', 'Stock', 'Actions'].map((h) => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} style={tr}>
                        <td style={td}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--bone)' }}>
                            {product.name}
                          </span>
                          {product.description && (
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--bone-dim)', margin: '0.2rem 0 0' }}>
                              {product.description.slice(0, 60)}{product.description.length > 60 ? '…' : ''}
                            </p>
                          )}
                        </td>
                        <td style={td}>
                          <span style={typeBadge}>{product.type}</span>
                        </td>
                        <td style={{ ...td, fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>
                          {Number(product.price).toFixed(2)} €
                        </td>
                        <td style={{ ...td, fontFamily: 'var(--font-display)', color: product.stock > 0 ? 'var(--bone)' : 'var(--bone-dim)' }}>
                          {product.stock}
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-outline-sm" onClick={() => openEdit(product)}>
                              Modifier
                            </button>
                            <button
                              style={deleteBtn}
                              onClick={() => handleDelete(product.id)}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Product form modal */}
        {showForm && (
          <div style={overlay} onClick={() => setShowForm(false)}>
            <div style={modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={sectionHeading}>{editing ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <form onSubmit={handleSubmit} style={formStyle}>
                <div style={formField}>
                  <label style={formLabel}>Nom</label>
                  <input style={formInput} required maxLength={255} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={saving} />
                </div>
                <div style={formField}>
                  <label style={formLabel}>Description</label>
                  <textarea style={{ ...formInput, resize: 'vertical' }} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={saving} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={formField}>
                    <label style={formLabel}>Prix (€)</label>
                    <input style={formInput} type="number" required min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} disabled={saving} />
                  </div>
                  <div style={formField}>
                    <label style={formLabel}>Stock</label>
                    <input style={formInput} type="number" required min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} disabled={saving} />
                  </div>
                </div>
                <div style={formField}>
                  <label style={formLabel}>Type</label>
                  <select style={formInput} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProductType }))} disabled={saving}>
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {formError && <p style={errorMsg}>{formError}</p>}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} disabled={saving}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.65rem 1.5rem', opacity: saving ? 0.6 : 1 }} disabled={saving}>
                    {saving ? 'Sauvegarde…' : editing ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.9rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--bone)',
};
const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};
const th: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.6rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--bone-dim)',
  padding: '0.75rem 1rem',
  textAlign: 'left',
  borderBottom: '1px solid var(--ash-mid)',
};
const tr: React.CSSProperties = {
  borderBottom: '1px solid var(--ash)',
};
const td: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  color: 'var(--bone-dim)',
  padding: '0.9rem 1rem',
  verticalAlign: 'middle',
};
const typeBadge: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--blood-bright)',
  border: '1px solid var(--blood)',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
};
const deleteBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--blood)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--blood-bright)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  fontSize: '0.6rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '0.3rem 0.6rem',
};
const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};
const modal: React.CSSProperties = {
  background: 'var(--ink-light)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius)',
  padding: '2rem',
  width: '100%',
  maxWidth: '540px',
  maxHeight: '90vh',
  overflowY: 'auto',
};
const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  marginTop: '1.5rem',
};
const formField: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};
const formLabel: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.65rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--bone-dim)',
};
const formInput: React.CSSProperties = {
  background: 'var(--ash)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--bone)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  padding: '0.65rem 0.85rem',
  outline: 'none',
  width: '100%',
};
const stateMsg: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--bone-dim)',
  padding: '3rem 0',
  textAlign: 'center',
};
const errorMsg: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  color: 'var(--blood-bright)',
};
