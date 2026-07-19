import { useEffect, useState } from 'react';
import { getCannedResponses } from '../api/notifications';
import { IconZap, IconSearch } from './Icons';

export default function CannedResponsePicker({ onSelect }) {
  const [canned, setCanned] = useState([]);
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCannedResponses().then((res) => setCanned(res.data.data)).catch(() => {});
  }, []);

  const filtered = canned.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!canned.length) return null;

  return (
    <div className="canned-wrap">
      <button type="button" className="btn-sm btn-outline canned-btn" onClick={() => setOpen(!open)}>
        <IconZap width={13} height={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
        Canned Responses
      </button>
      {open && (
        <div className="canned-dropdown">
          <div className="canned-search-wrap">
            <IconSearch width={14} height={14} className="canned-search-icon" />
            <input
              className="canned-search"
              placeholder="Search responses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="canned-list">
            {filtered.length === 0 ? (
              <div className="canned-empty">No responses found</div>
            ) : (
              filtered.map((c) => (
                <div key={c.id} className="canned-item"
                  onClick={() => { onSelect(c.body); setOpen(false); setSearch(''); }}>
                  <strong>{c.title}</strong>
                  <p>{c.body.slice(0, 80)}{c.body.length > 80 ? '…' : ''}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
