'use client';

import { UPLOAD_MAX_BYTES, uploadMaxMegabytes, type UploadMimeType } from '@webdakwah/shared';
import { UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';

import { requestUploadAction } from './upload-actions';

const AUDIO_TYPES: UploadMimeType[] = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg'];
const VIDEO_TYPES: UploadMimeType[] = ['video/mp4', 'video/webm'];

function putFile(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();

    request.open('PUT', uploadUrl);
    request.setRequestHeader('Content-Type', file.type);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => resolve(request.status >= 200 && request.status < 300);
    request.onerror = () => resolve(false);
    request.onabort = () => resolve(false);
    request.send(file);
  });
}

export function MediaUploadField({
  type,
  value,
  onChange,
}: {
  type: 'AUDIO' | 'VIDEO';
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const allowed = type === 'AUDIO' ? AUDIO_TYPES : VIDEO_TYPES;
  const maxMegabytes = Math.max(...allowed.map((mime) => uploadMaxMegabytes(mime)));

  async function handleFile(file: File) {
    setError(null);
    setUploaded(false);

    if (!allowed.includes(file.type as UploadMimeType)) {
      setError(
        type === 'AUDIO'
          ? 'Format audio harus MP3, M4A, AAC, atau OGG.'
          : 'Format video harus MP4 atau WebM.',
      );
      return;
    }

    const maxBytes = UPLOAD_MAX_BYTES[file.type as UploadMimeType];

    if (file.size > maxBytes) {
      setError(`Ukuran berkas maksimal ${maxMegabytes} MB.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    const result = await requestUploadAction({ contentType: file.type, size: file.size });

    if (!result.ok) {
      setError(result.error);
      setUploading(false);
      return;
    }

    const success = await putFile(result.uploadUrl, file, setProgress);

    setUploading(false);

    if (!success) {
      setError('Unggahan gagal. Periksa koneksi lalu coba lagi.');
      return;
    }

    setProgress(100);
    setUploaded(true);
    onChange(result.publicUrl);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-700">
          <UploadCloud aria-hidden className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor="media-file" className="text-sm font-medium text-ink-800">
            Unggah berkas dari perangkat
          </label>
          <p className="mt-1 text-xs text-ink-500">
            {type === 'AUDIO' ? 'MP3, M4A, AAC, atau OGG' : 'MP4 atau WebM'} · maksimal{' '}
            {maxMegabytes} MB. Berkas diunggah langsung ke penyimpanan media.
          </p>
          <input
            ref={inputRef}
            id="media-file"
            type="file"
            accept={allowed.join(',')}
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void handleFile(file);
              }
            }}
            className="mt-3 block w-full text-sm text-ink-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {uploading ? (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-200">
                <div
                  className="h-full rounded-full bg-brand-600 transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-ink-500">
                Mengunggah… {progress}%{progress === 0 ? ' (menyiapkan)' : ''}
              </p>
            </div>
          ) : null}

          {uploaded ? (
            <p className="mt-3 text-xs text-emerald-700">
              Berkas berhasil diunggah. Tautan media sudah terisi otomatis.
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          {value && !uploading ? (
            <p className="mt-3 truncate text-xs text-ink-500">
              Tautan aktif: <span className="text-ink-700">{value}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
