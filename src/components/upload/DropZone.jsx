// src/components/upload/DropZone.jsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

export function DropZone({ onFile }) {
  const [isDragActive, setDragActive] = useState(false);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) onFile(accepted[0]);
    setDragActive(false);
  }, [onFile]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  return (
    <motion.div
      {...getRootProps()}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.998 }}
      style={{
        border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border2)'}`,
        borderRadius: 20,
        padding: '56px 32px',
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragActive
          ? 'rgba(123,140,222,0.06)'
          : 'rgba(13,20,36,0.5)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <input {...getInputProps()} />

      {/* Animated background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: isDragActive ? 0.15 : 0.05,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        transition: 'opacity 0.3s',
      }} />

      <AnimatePresence mode="wait">
        {isDragActive ? (
          <motion.div
            key="drag"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent2)' }}>
              Drop to upload
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
              background: 'rgba(123,140,222,0.1)',
              border: '1px solid rgba(123,140,222,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              Drop your CSV file here
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              or <span style={{ color: 'var(--accent2)', textDecoration: 'underline' }}>browse files</span>
            </div>
            <div style={{
              display: 'inline-flex', gap: 8, fontSize: 11, color: 'var(--muted)',
              background: 'var(--surface2)', borderRadius: 8, padding: '6px 14px',
            }}>
              <span>Accepts .csv</span>
              <span style={{ color: 'var(--border2)' }}>·</span>
              <span>Lab test parameters</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
