import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getKbArticle, voteKbArticle } from '../../api/kb';
import { useAuth } from '../../context/AuthContext';

export default function KbArticleDetail() {
  const { slug }     = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted]     = useState(false);
  const [error, setError]     = useState(null);

  const prefix = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/user';

  useEffect(() => {
    setLoading(true);
    getKbArticle(slug)
      .then((res) => setArticle(res.data.data))
      .catch(() => setError('Article not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleVote = async (helpful) => {
    if (voted) return;
    await voteKbArticle(article.id, helpful);
    setVoted(true);
    setArticle((a) => ({
      ...a,
      helpful_count: helpful ? a.helpful_count + 1 : a.helpful_count,
      not_helpful_count: !helpful ? a.not_helpful_count + 1 : a.not_helpful_count,
    }));
  };

  if (loading) return <div className="page"><div className="skeleton-card"><div className="skeleton-line w-80" /><div className="skeleton-line w-60" /><div className="skeleton-line w-100" /></div></div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!article) return null;

  return (
    <div className="page">
      <div className="kb-article-header">
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <Link to={`${prefix}/kb/manage`} className="btn-sm btn-outline">Edit Articles</Link>
        )}
      </div>

      <article className="kb-article">
        <div className="kb-article-meta">
          {article.category && <span className="kb-article-category">{article.category.name}</span>}
          {article.is_internal && <span className="kb-internal-badge">Internal Only</span>}
          <span className="kb-article-views">{article.view_count} views</span>
        </div>

        <h1 className="kb-article-title">{article.title}</h1>

        <div className="kb-article-info">
          <span>By {article.author?.name}</span>
          {article.published_at && <span>Published {new Date(article.published_at).toLocaleDateString()}</span>}
        </div>

        {article.tags?.length > 0 && (
          <div className="kb-article-tags">
            {article.tags.map((tag, i) => <span key={i} className="kb-tag">{tag}</span>)}
          </div>
        )}

        <div className="kb-article-body" dangerouslySetInnerHTML={{ __html: formatBody(article.body) }} />

        {/* Feedback */}
        <div className="kb-feedback">
          <p>Was this article helpful?</p>
          {voted ? (
            <span className="kb-feedback-thanks">Thanks for your feedback!</span>
          ) : (
            <div className="kb-feedback-btns">
              <button onClick={() => handleVote(true)} className="btn-sm btn-success-outline">👍 Yes ({article.helpful_count})</button>
              <button onClick={() => handleVote(false)} className="btn-sm btn-danger-outline">👎 No ({article.not_helpful_count})</button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

/** Simple markdown-like formatting: paragraphs, bold, code blocks */
function formatBody(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}
