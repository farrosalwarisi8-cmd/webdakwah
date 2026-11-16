'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface RichTextEditorProps {
  name: string;
  initialValue?: string;
  placeholder?: string;
}

export function RichTextEditor({ name, initialValue, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
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

  return (
    <div className="space-y-2">
      <input type="hidden" id={`${name}-input`} name={name} defaultValue={initialValue ?? ''} />
      <div className="rounded-xl border border-ink-200 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-ink-200 px-2 py-1.5">
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
        </div>
        <EditorContent editor={editor} className="prose prose-sm max-w-none px-3.5 py-2.5" />
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
        active ? 'bg-brand-100 text-brand-800' : 'text-ink-600 hover:bg-ink-100'
      }`}
    >
      {label}
    </button>
  );
}