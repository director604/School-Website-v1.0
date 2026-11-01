import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

declare global {
  interface Window {
    tinymce?: any;
  }
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'พิมพ์เนื้อหาข่าว หรือจัดรูปแบบข้อความที่นี่...',
  height = 420,
  disabled = false
}) => {
  const editorIdRef = useRef<string>(`tinymce-editor-${Math.random().toString(36).substring(2, 9)}`);
  const editorInstanceRef = useRef<any>(null);
  const isUpdatingFromProps = useRef<boolean>(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const editorId = editorIdRef.current;

    const initTinyMCE = () => {
      if (!window.tinymce) {
        // Fallback: load script if not yet loaded
        const scriptId = 'tinymce-cdn-script';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js';
          script.referrerPolicy = 'origin';
          script.onload = () => {
            if (isMounted) initTinyMCE();
          };
          document.head.appendChild(script);
          return;
        } else {
          setTimeout(initTinyMCE, 100);
          return;
        }
      }

      // If an instance with this ID already exists, remove it first
      const existing = window.tinymce.get(editorId);
      if (existing) {
        existing.remove();
      }

      window.tinymce.init({
        selector: `#${editorId}`,
        height: height,
        menubar: 'file edit view insert format tools table',
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks fontfamily fontsize | ' +
          'bold italic underline strikethrough | forecolor backcolor | ' +
          'alignleft aligncenter alignright alignjustify | ' +
          'bullist numlist outdent indent | table link image | ' +
          'removeformat code fullscreen',
        font_family_formats: 'Sarabun=Sarabun,sans-serif; Plus Jakarta Sans=Plus Jakarta Sans,sans-serif; Angsana New=Angsana New,serif; Cordia New=Cordia New,sans-serif; TH Sarabun New=TH Sarabun New,sans-serif; Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace',
        font_size_formats: '12px 14px 15px 16px 18px 20px 24px 28px 32px 36px',
        content_style: `
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap');
          body {
            font-family: 'Sarabun', 'Plus Jakarta Sans', system-ui, sans-serif;
            font-size: 15px;
            color: #1e293b;
            line-height: 1.7;
            padding: 16px;
            background-color: #ffffff;
          }
          p { margin: 0 0 10px 0; }
          h1, h2, h3, h4, h5, h6 { font-family: 'Plus Jakarta Sans', 'Sarabun', sans-serif; color: #0f172a; font-weight: 700; margin-top: 18px; margin-bottom: 8px; }
          h1 { font-size: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          h2 { font-size: 20px; color: #1e3a8a; }
          h3 { font-size: 17px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
          th { background-color: #f1f5f9; font-weight: 600; color: #0f172a; }
          img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
          blockquote { border-left: 4px solid #2563eb; margin: 12px 0; padding-left: 14px; color: #475569; font-style: italic; background-color: #f8fafc; padding-top: 6px; padding-bottom: 6px; border-radius: 0 8px 8px 0; }
          a { color: #2563eb; text-decoration: underline; }
          ul { list-style-type: disc; padding-left: 24px; margin: 8px 0; }
          ol { list-style-type: decimal; padding-left: 24px; margin: 8px 0; }
          li { margin-bottom: 4px; }
        `,
        placeholder: placeholder,
        branding: false,
        promotion: false,
        statusbar: true,
        elementpath: true,
        resize: true,
        readonly: disabled,
        setup: (editor: any) => {
          editorInstanceRef.current = editor;

          editor.on('init', () => {
            if (isMounted) {
              setIsEditorReady(true);
              if (value) {
                editor.setContent(value);
              }
            }
          });

          const syncChange = () => {
            if (isUpdatingFromProps.current) return;
            const newContent = editor.getContent();
            onChange(newContent);
          };

          editor.on('change keyup undo redo paste input NodeChange', syncChange);
        }
      });
    };

    initTinyMCE();

    return () => {
      isMounted = false;
      if (window.tinymce && editorInstanceRef.current) {
        try {
          window.tinymce.remove(editorInstanceRef.current);
        } catch (e) {
          // ignore cleanup errors on modal close
        }
        editorInstanceRef.current = null;
      }
    };
  }, [height]);

  // Sync external value changes into editor without clobbering cursor
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (editor && isEditorReady) {
      const currentContent = editor.getContent();
      if (value !== currentContent) {
        isUpdatingFromProps.current = true;
        editor.setContent(value || '');
        isUpdatingFromProps.current = false;
      }
    }
  }, [value, isEditorReady]);

  // Sync disabled state
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (editor && isEditorReady) {
      if (typeof editor.mode?.set === 'function') {
        editor.mode.set(disabled ? 'readonly' : 'design');
      }
    }
  }, [disabled, isEditorReady]);

  return (
    <div className="relative rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
      {!isEditorReady && (
        <div className="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">กำลังโหลดโปรแกรมแก้ไขข้อความ WYSIWYG (TinyMCE)...</span>
        </div>
      )}
      <textarea
        id={editorIdRef.current}
        defaultValue={value}
        className="w-full opacity-0 pointer-events-none"
        style={{ height }}
      />
    </div>
  );
};
