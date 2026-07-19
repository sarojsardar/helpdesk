import { useRef, useState } from 'react';
import { uploadAttachment, deleteAttachment } from '../api/notifications';
import { useToast } from '../context/ToastContext';
import { IconPaperclip, IconUpload, IconTrash, IconFileText, IconImage, IconArchive } from './Icons';

export default function FileAttachments({ ticketId, attachments = [], onUpdate, canDelete }) {
  const toast    = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) await uploadAttachment(ticketId, file);
      toast('File uploaded');
      onUpdate?.();
    } catch {
      toast('Upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAttachment(id);
      toast('Attachment removed');
      onUpdate?.();
    } catch {
      toast('Failed to remove', 'error');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024)    return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFileIcon = (mime) => {
    if (mime?.startsWith('image/'))                              return <IconImage width={16} height={16} />;
    if (mime?.includes('spreadsheet') || mime?.includes('excel'))return <IconFileText width={16} height={16} />;
    if (mime?.includes('zip'))                                   return <IconArchive width={16} height={16} />;
    return <IconFileText width={16} height={16} />;
  };

  return (
    <div className="attachments-section">
      <div className="attachments-header">
        <span className="attachments-title">
          <IconPaperclip width={15} height={15} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </span>
        <button className="btn-sm btn-outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <IconUpload width={13} height={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {uploading ? 'Uploading…' : 'Add File'}
        </button>
        <input ref={inputRef} type="file" multiple hidden onChange={handleUpload}
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.csv,.log" />
      </div>

      {attachments.length > 0 && (
        <div className="attachments-list">
          {attachments.map((a) => (
            <div key={a.id} className="attachment-item">
              <span className="attachment-icon">{getFileIcon(a.mime_type)}</span>
              <a href={a.url} target="_blank" rel="noreferrer" className="attachment-name">{a.original_name}</a>
              <span className="attachment-size">{formatSize(a.size)}</span>
              {canDelete && (
                <button className="attachment-del" onClick={() => handleDelete(a.id)} title="Remove">
                  <IconTrash width={13} height={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
