import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getKbArticles, getKbCategories } from '../../api/kb';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [lastPage, setLastPage]     = useState(1);
  const [search, setSearch]         = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('cat') || '');
  const [loading, setLoading]       = useState(true);

  const prefix = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/user';

  const load = (p = 1) => {
    setLoading(true);
    const params = { page: p, per_page: 12 };
    if (search) params.search = search;
    if (categoryId) params.category_id = categoryId;

    getKbArticles(params)
      .then((res) => {
        setArticles(res.data.data.data);
        setTotal(res.data.data.total);
        setPage(res.data.data.current_page);
        setLastPage(res.data.data.last_page);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getKbCategories().then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => { load(1); }, [search, categoryId]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.target.elements.q.value;
    setSearch(q);
    setSearchParams(q ? { q } : {});
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Knowledge Base</h2>
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <Link to={`${prefix}/kb/manage`} className="btn-primary btn-sm">Manage Articles</Link>
        )}
      </div>

      {/* Search and filter */}
      <div className="kb-controls">
        <form onSubmit={handleSearch} className="kb-search-form">
          <input type="text" name="q" placeholder="Search articles..." defaultValue={search} className="kb-search-input" />
          <button type="submit" className="btn-primary btn-sm">Search</button>
        </form>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="kb-category-filter">
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.articles_count})</option>
          ))}
        </select>
      </div>

      {/* Article grid */}
      {loading ? (
        <div className="kb-grid">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="kb-card kb-card-skeleton"><div className="skeleton-line w-80" /><div className="skeleton-line w-60" /></div>)}
        </div>
      ) : articles.length === 0 ? (
        <div className="kb-empty">
          <p>No articles found{search ? ` for "${search}"` : ''}.</p>
        </div>
      ) : (
        <>
          <div className="kb-grid">
            {articles.map((article) => (
              <Link to={`${prefix}/kb/${article.slug}`} key={article.id} className="kb-card">
                <div className="kb-card-category">{article.category?.name || 'Uncategorized'}</div>
                <h3 className="kb-card-title">{article.title}</h3>
                <p className="kb-card-excerpt">{article.excerpt || article.body?.substring(0, 120) + '...'}</p>
                <div className="kb-card-footer">
                  <span>{article.author?.name}</span>
                  <span>{article.view_count} views</span>
                  {article.is_internal && <span className="kb-internal-badge">Internal</span>}
                </div>
              </Link>
            ))}
          </div>
          {lastPage > 1 && (
            <Pagination page={page} lastPage={lastPage} onPageChange={(p) => load(p)} />
          )}
        </>
      )}
    </div>
  );
}
