import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getTickets, bulkUpdate, getTags, getSavedFilters, createSavedFilter, deleteSavedFilter } from '../../api/tickets';
import { getCategories, getAgents } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

const PRIORITY_COLORS = { low: '#6c757d', medium: '#0d6efd', high: '#fd7e14', critical: '#dc3545' };
const STATUS_COLORS   = { open: '#0d6efd', in_progress: '#fd7e14', resolved: '#198754', closed: '#6c757d' };

const SORTABLE_COLS = [
  { key: 'id',         label: '#' },
  { key: 'title',      label: 'Title',   noSort: true },
  { key: 'priority',   label: 'Priority' },
  { key: 'status',     label: 'Status' },
  { key: 'created_at', label: 'Created' },
];

const DEFAULT_FILTERS = { status: '', priority: '', category_id: '', tag_id: '', search: '', sort_by: 'created_at', sort_dir: 'desc', page: 1, per_page: 15 };

export default function TicketList() {
  const { user }                        = useAuth();
  const [tickets, setTickets]           = useState([]);
  const [meta, setMeta]                 = useState({});
  const [categories, setCategories]     = useState([]);
  const [agents, setAgents]             = useState([]);
  const [tags, setTags]                 = useState([]);
  const [savedFilters, setSavedFilters] = useState([]);
  const [filters, setFilters]           = useState(DEFAULT_FILTERS);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState([]);
  const [bulkAction, setBulkAction]     = useState('');
  const [bulkValue, setBulkValue]       = useState('');
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const debounceRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const prefix  = user?.role === 'admin' ? 'admin' : user?.role === 'staff' ? 'staff' : 'user';

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.data));
    getTags().then((r) => setTags(r.data.data));
    if (isAdmin) {
      getAgents().then((r) => setAgents(r.data.data));
      getSavedFilters().then((r) => setSavedFilters(r.data.data));
    }
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    setSelected([]);
    getTickets(filters)
      .then((r) => {
        const d = r.data.data;
        setTickets(Array.isArray(d) ? d : (d.data ?? []));
        setMeta(Array.isArray(d) ? { total: d.length } : d);
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilters((f) => ({ ...f, search: val, page: 1 })), 400);
  }, []);

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value, page: 1 }));

  const toggleSort = (key) => setFilters((f) => ({
    ...f, sort_by: key,
    sort_dir: f.sort_by === key && f.sort_dir === 'desc' ? 'asc' : 'desc', page: 1,
  }));

  const clearFilters = () => { setSearch(''); setFilters(DEFAULT_FILTERS); };

  const toggleSelect = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll    = () => setSelected(selected.length === tickets.length ? [] : tickets.map((t) => t.id));

  const handleBulk = async () => {
    if (!bulkAction || selected.length === 0) return;
    setBulkLoading(true);
    try {
      await bulkUpdate({ ticket_ids: selected, action: bulkAction, value: bulkValue || null });
      setSelected([]); setBulkAction(''); setBulkValue('');
      setFilters((f) => ({ ...f })); // re-trigger load
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSaveFilter = async () => {
    if (!saveFilterName.trim()) return;
    const saved = await createSavedFilter({ name: saveFilterName, filters });
    setSavedFilters((s) => [...s, saved.data.data]);
    setSaveFilterName(''); setShowSaveFilter(false);
  };

  const applyFilter = (sf) => { setFilters({ ...DEFAULT_FILTERS, ...sf.filters }); setSearch(sf.filters.search || ''); };

  const removeFilter = async (id) => {
    await deleteSavedFilter(id);
    setSavedFilters((s) => s.filter((f) => f.id !== id));
  };

  const activeFilterCount = [filters.status, filters.priority, filters.category_id, filters.tag_id, filters.search].filter(Boolean).length;

  const SortIcon = ({ col }) => {
    if (col.noSort) return null;
    if (filters.sort_by !== col.key) return <span className="sort-icon sort-idle">↕</span>;
    return <span className="sort-icon sort-active">{filters.sort_dir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Tickets {meta.total > 0 && <span className="ticket-count">({meta.total})</span>}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <button className="btn-sm btn-outline" onClick={() => setShowSaveFilter((v) => !v)}>
              💾 Save Filter
            </button>
          )}
          <Link to={`/${prefix}/tickets/create`} className="btn-primary">+ New Ticket</Link>
        </div>
      </div>

      {/* Saved filters */}
      {isAdmin && savedFilters.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {savedFilters.map((sf) => (
            <div key={sf.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>
              <button onClick={() => applyFilter(sf)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', fontWeight: 600, padding: 0 }}>{sf.name}</button>
              <button onClick={() => removeFilter(sf.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 11, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Save filter input */}
      {showSaveFilter && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={saveFilterName} onChange={(e) => setSaveFilterName(e.target.value)} placeholder="Filter name…" className="filter-search" style={{ width: 200 }} />
          <button className="btn-sm btn-primary" onClick={handleSaveFilter}>Save</button>
          <button className="btn-sm btn-outline" onClick={() => setShowSaveFilter(false)}>Cancel</button>
        </div>
      )}

      {/* Filters bar */}
      <div className="filters">
        <div className="filter-search-wrap">
          <input placeholder="Search tickets…" value={search} onChange={handleSearch} className="filter-search" />
          {search && <button className="filter-clear-x" onClick={() => { setSearch(''); setFilters((f) => ({ ...f, search: '', page: 1 })); }}>✕</button>}
        </div>
        <select value={filters.status} onChange={setFilter('status')}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={filters.priority} onChange={setFilter('priority')}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select value={filters.category_id} onChange={setFilter('category_id')}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.tag_id} onChange={setFilter('tag_id')}>
          <option value="">All Tags</option>
          {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {activeFilterCount > 0 && (
          <button className="btn-clear-filters" onClick={clearFilters}>
            Clear filters <span className="filter-badge">{activeFilterCount}</span>
          </button>
        )}
      </div>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="active-filters">
          {filters.status && <span className="filter-tag">Status: {filters.status.replace('_', ' ')}<button onClick={() => setFilters((f) => ({ ...f, status: '', page: 1 }))}>✕</button></span>}
          {filters.priority && <span className="filter-tag">Priority: {filters.priority}<button onClick={() => setFilters((f) => ({ ...f, priority: '', page: 1 }))}>✕</button></span>}
          {filters.category_id && <span className="filter-tag">Category: {categories.find((c) => String(c.id) === filters.category_id)?.name}<button onClick={() => setFilters((f) => ({ ...f, category_id: '', page: 1 }))}>✕</button></span>}
          {filters.tag_id && <span className="filter-tag">Tag: {tags.find((t) => String(t.id) === filters.tag_id)?.name}<button onClick={() => setFilters((f) => ({ ...f, tag_id: '', page: 1 }))}>✕</button></span>}
          {filters.search && <span className="filter-tag">Search: "{filters.search}"<button onClick={() => { setSearch(''); setFilters((f) => ({ ...f, search: '', page: 1 })); }}>✕</button></span>}
        </div>
      )}

      {/* Bulk actions bar */}
      {isAdmin && selected.length > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selected.length} selected</span>
          <select value={bulkAction} onChange={(e) => { setBulkAction(e.target.value); setBulkValue(''); }}>
            <option value="">Choose action…</option>
            <option value="status">Change Status</option>
            <option value="priority">Change Priority</option>
            <option value="assign">Assign To</option>
            <option value="close">Close All</option>
          </select>
          {bulkAction === 'status' && (
            <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}>
              <option value="">Select status…</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          )}
          {bulkAction === 'priority' && (
            <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}>
              <option value="">Select priority…</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          )}
          {bulkAction === 'assign' && (
            <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}>
              <option value="">Select agent…</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <button className="btn-sm btn-primary" onClick={handleBulk} disabled={bulkLoading || !bulkAction}>
            {bulkLoading ? 'Applying…' : 'Apply'}
          </button>
          <button className="btn-sm btn-outline" onClick={() => setSelected([])}>Deselect</button>
        </div>
      )}

      {loading ? <p className="loading-text">Loading…</p> : (
        <table className="table">
          <thead>
            <tr>
              {isAdmin && <th><input type="checkbox" checked={selected.length === tickets.length && tickets.length > 0} onChange={toggleAll} /></th>}
              {SORTABLE_COLS.map((col) => (
                <th key={col.key} onClick={() => !col.noSort && toggleSort(col.key)} className={!col.noSort ? 'sortable-col' : ''}>
                  {col.label} <SortIcon col={col} />
                </th>
              ))}
              <th>Category</th>
              <th>Tags</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className={selected.includes(t.id) ? 'row-selected' : ''}>
                {isAdmin && <td><input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleSelect(t.id)} /></td>}
                <td>{t.id}</td>
                <td><Link to={`/${prefix}/tickets/${t.id}`}>{t.title}</Link></td>
                <td><span className="badge" style={{ background: PRIORITY_COLORS[t.priority] }}>{t.priority}</span></td>
                <td><span className="badge" style={{ background: STATUS_COLORS[t.status] }}>{t.status.replace('_', ' ')}</span></td>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                <td>{t.category?.name || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {t.tags?.map((tag) => (
                      <span key={tag.id} style={{ background: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}44`, borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{t.assignee?.name || 'Unassigned'}</td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '2rem' }}>No tickets found</td></tr>}
          </tbody>
        </table>
      )}

      <Pagination
        meta={meta}
        perPage={filters.per_page}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        onPerPageChange={(n) => setFilters((f) => ({ ...f, per_page: n, page: 1 }))}
      />
    </div>
  );
}
