'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TemplateEditorStudio from '@/components/TemplateEditorStudio';

export default function AddTemplatePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <TemplateEditorStudio
        onCancel={() => router.push('/admin')}
        onSave={() => router.push('/admin')}
        showToast={(msg) => alert(msg)}
        adminPin="1234"
      />
    </div>
  );
}
