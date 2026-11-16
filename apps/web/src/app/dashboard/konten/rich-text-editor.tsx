'use client';

import Image from '@tiptap/extension-image';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  UPLOAD_IMAGE_MIME_TYPES,
  UPLOAD_MAX_BYTES,
  uploadMaxMegabytes,
  type UploadMimeType,
} from '@webdakwah/shared';
import { useEffect, useRef, useState } from 'react';

import { requestUploadAction } from './upload-actions';

interface RichTextEditorProps {
  name: string;
  initialValue?: string;
  placeholder?: string;
}

const imageMaxMegabytes = Math.max(...UPLOAD_IMAGE_MIME_TYPES.map(uploadMaxMegabytes));

export function RichTextEditor({ name, initialValue, placeholder }: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ allowBase64: false })],
    content: initialValue ?? '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-[12rem] w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500',
        'data-placeholder': placeholder ?? '',
      },
    },
    onUpdate: ({ editor: current }) => {
      const input = document.getElementById(`${name}-input`) as HTMLInputElement | null;
      if (input) input.value = current.getHTML();
    },
  });

  useEffect(() => {
    const input = document.getElementById(`${name}-input`) as HTMLInputElement | null;
    if (input && editor) input.value = editor.getHTML();
  }, [editor, name]);

  async function handleImageFile(file: File) {
    setImageError(null);

    if (!UPLOAD_IMAGE_MIME_TYPES.includes(file.type as UploadMimeType)) {
      setImageError('Format gambar harus JPEG, PNG, WebP, atau GIF.');
      return;
    }

    const maxBytes = UPLOAD_MAX_BYTES[file.type as UploadMimeType];

    if (file.size > maxBytes) {
      setImageError(`Ukuran gambar maksimal ${imageMaxMegabytes} MB.`);
      return;
    }

    setUploadingImage(true);

    try {
      const result = await requestUploadAction({ contentType: file.type, size: file.size });

      if (!result.ok) {
        setImageError(result.error);
        return;
      }

      const response = await fetch(result.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error('Unggahan gambar gagal.');
      }

      const alt =
        file.name
          .replace(/\.[^.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .trim() || 'Gambar';
      editor?.chain().focus().setImage({ src: result.publicUrl, alt }).run();
    } catch {
      setImageError('Unggahan gambar gagal. Periksa koneksi lalu coba lagi.');
    } finally {
      setUploadingImage(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" id={`${name}-input`} name={name} defaultValue={initialValue ?? ''} />
      <div className="rounded-xl border border-ink-200 bg-white">
        <div className="flex flex-wrap items-center gap-1 border-b border-ink-200 px-2 py-1.5">
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive('bold') ?? false}
            label="B"
          />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive('italic') ?? false}
            label="I"
          />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor?.isActive('heading', { level: 2 }) ?? false}
            label="H2"
          />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive('bulletList') ?? false}
            label="•"
          />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive('orderedList') ?? false}
            label="1."
          />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            active={editor?.isActive('blockquote') ?? false}
            label="❝"
          />
          <span aria-hidden className="mx-1 h-6 w-px bg-ink-200" />
          <ToolbarButton
            onClick={() => imageInputRef.current?.click()}
            active={false}
            disabled={uploadingImage}
            label={uploadingImage ? 'Mengunggah…' : 'Gambar'}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept={UPLOAD_IMAGE_MIME_TYPES.join(',')}
            disabled={uploadingImage}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void handleImageFile(file);
              }
            }}
            className="hidden"
          />
        </div>
        <EditorContent
          editor={editor}
          className="content-body prose prose-sm max-w-none px-3.5 py-2.5"
        />
        {imageError ? (
          <p role="alert" className="px-3.5 pb-2.5 text-xs text-red-700">
            {imageError}
          </p>
        ) : (
          <p className="px-3.5 pb-2.5 text-xs text-ink-500">
            Sisipkan gambar JPEG, PNG, WebP, atau GIF maksimal {imageMaxMegabytes} MB.
          </p>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  disabled = false,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
        active ? 'bg-brand-100 text-brand-800' : 'text-ink-600 hover:bg-ink-100'
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {label}
    </button>
  );
}
