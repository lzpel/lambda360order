'use client';

import { useState, useRef, useCallback, DragEvent } from 'react';
import Link from 'next/link';
import { stepUploadUrl, stepExecute, stepStatus } from '@/out/client';

async function sha256hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

type Status = 'hashing' | 'uploading' | 'executing' | 'done' | 'error';

interface FileEntry {
  entryId: string;
  name: string;
  sha256: string;
  status: Status;
  message: string;
  progress: number;
  contentHash?: string;
}

let _counter = 0;
function uid() {
  return String(++_counter);
}

export default function UploadPage() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateEntry = useCallback((entryId: string, patch: Partial<FileEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.entryId === entryId ? { ...e, ...patch } : e))
    );
  }, []);

  const processFile = useCallback(
    async (entryId: string, file: File) => {
      // 1. SHA256 計算
      let sha256 = '';
      try {
        sha256 = await sha256hex(file);
        updateEntry(entryId, { sha256, status: 'uploading', message: 'アップロードURL取得中...' });
      } catch {
        updateEntry(entryId, { status: 'error', message: 'SHA256計算失敗' });
        return;
      }

      // 2. Presigned URL 取得
      let uploadId: string;
      let uploadUrl: string;
      try {
        const { data, error } = await stepUploadUrl();
        if (error || !data) throw new Error(String(error));
        uploadId = data.id;
        uploadUrl = data.url;
      } catch (e) {
        updateEntry(entryId, { sha256, status: 'error', message: `アップロードURL取得失敗: ${e}` });
        return;
      }

      // 3. S3 へ PUT（XHR でアップロード進捗を取得）
      try {
        updateEntry(entryId, { sha256, status: 'uploading', message: 'S3アップロード中... 0%', progress: 0 });
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', 'application/octet-stream');
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              updateEntry(entryId, {
                sha256,
                status: 'uploading',
                message: `S3アップロード中... ${pct}%`,
                progress: pct,
              });
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`HTTP ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error('ネットワークエラー'));
          xhr.send(file);
        });
      } catch (e) {
        updateEntry(entryId, { sha256, status: 'error', message: `S3アップロード失敗: ${e}` });
        return;
      }

      // 4. execute 開始（長時間ジョブ、完了まで待つ）
      updateEntry(entryId, { sha256, status: 'executing', message: '変換開始中...', progress: 0 });
      const execPromise = stepExecute({ path: { id: uploadId } }).then(({ data, error }) => {
        if (error) throw new Error(String(error));
        return data as string;
      });

      // 5. status ポーリング
      // 大きなファイルでは execute が 504 タイムアウトしても Lambda 側の処理は継続するため、
      // progress >= 100 を唯一の完了判定とする
      let done = false;
      while (!done) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const { data: s } = await stepStatus({ path: { id: uploadId } });
          if (s) {
            updateEntry(entryId, {
              sha256,
              status: 'executing',
              message: s.message,
              progress: s.progress,
            });
            if (s.progress >= 100) done = true;
          }
        } catch {
          // 一時的なエラーは無視してポーリング継続
        }
      }

      // 6. 完了確定。execute が 200 で返っていれば content_hash を使い、
      //    504 などで reject 済みでも status で完了確認済みなのでエラー扱いしない
      let contentHash: string | undefined;
      try {
        contentHash = await execPromise;
      } catch {
        // 504 等は無視
      }
      updateEntry(entryId, {
        sha256,
        status: 'done',
        message: '変換完了',
        progress: 100,
        contentHash,
      });
    },
    [updateEntry]
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => /\.(step|stp)$/i.test(f.name));
      if (files.length === 0) return;

      const newEntries: FileEntry[] = files.map((file) => ({
        entryId: uid(),
        name: file.name,
        sha256: '',
        status: 'hashing',
        message: 'ハッシュ計算中...',
        progress: 0,
      }));

      setEntries((prev) => [...prev, ...newEntries]);

      for (let i = 0; i < files.length; i++) {
        processFile(newEntries[i].entryId, files[i]);
      }
    },
    [processFile]
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  return (
    <main
      style={{
        padding: '2rem',
        fontFamily: 'sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/" style={{ fontSize: '0.9rem', color: '#0070f3' }}>
          ← トップへ戻る
        </Link>
      </div>

      <h1 style={{ marginBottom: '0.25rem' }}>STEPファイル変換</h1>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        STEPファイルをアップロードしてBRepに変換します
      </p>

      {/* ドロップゾーン */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? '#0070f3' : '#ccc'}`,
          borderRadius: '10px',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#f0f7ff' : '#fafafa',
          transition: 'border-color 0.15s, background 0.15s',
          userSelect: 'none',
        }}
      >
        <p style={{ fontSize: '1.05rem', color: '#444' }}>
          STEPファイルをここにドロップ
        </p>
        <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.4rem' }}>
          またはクリックして選択（複数可、.step / .stp）
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".step,.stp"
          multiple
          onChange={onInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* ファイルリスト */}
      {entries.length > 0 && (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map((entry) => (
            <FileCard key={entry.entryId} entry={entry} />
          ))}
        </div>
      )}
    </main>
  );
}

const STATUS_LABEL: Record<Status, string> = {
  hashing: 'ハッシュ計算中',
  uploading: 'アップロード中',
  executing: '変換中',
  done: '完了',
  error: 'エラー',
};

const STATUS_COLOR: Record<Status, string> = {
  hashing: '#888',
  uploading: '#0070f3',
  executing: '#d97706',
  done: '#16a34a',
  error: '#dc2626',
};

function FileCard({ entry }: { entry: FileEntry }) {
  const color = STATUS_COLOR[entry.status];
  const progressPct = Math.min(Math.max(entry.progress, 0), 100);

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        background: '#fff',
      }}
    >
      {/* ヘッダー行 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.name}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {STATUS_LABEL[entry.status]}
        </span>
      </div>

      {/* SHA256 */}
      <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#555' }}>
        <span style={{ fontWeight: 600 }}>SHA256: </span>
        <code
          style={{
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            color: entry.sha256 ? '#222' : '#aaa',
          }}
        >
          {entry.sha256 || '—'}
        </code>
      </div>

      {/* プログレスバー（uploading 以降で表示） */}
      {entry.status !== 'hashing' && (
        <div style={{ marginTop: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#666',
              marginBottom: '0.3rem',
            }}
          >
            <span>{entry.message}</span>
            {entry.status === 'executing' && <span>{entry.progress}%</span>}
          </div>
          <div
            style={{
              height: '6px',
              borderRadius: '3px',
              background: '#e5e7eb',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: color,
                borderRadius: '3px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* content_hash（完了時） */}
      {entry.contentHash && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: '#555' }}>
          <span style={{ fontWeight: 600 }}>content_hash: </span>
          <code style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#222' }}>
            {entry.contentHash}
          </code>
        </div>
      )}

    </div>
  );
}
