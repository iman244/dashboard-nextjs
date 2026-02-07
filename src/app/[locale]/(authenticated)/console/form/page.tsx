'use client';

import { useEffect, useRef } from 'react';

export default function FormAfzar() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double-loading (important in React Strict Mode)
    if (containerRef.current.querySelector('script')) return;

    const script = document.createElement('script');
    script.src = 'https://formafzar.com/pages/formbuilder/ravesh-formbuilder.js';
    script.async = true;

    script.setAttribute('form-url', 'https://formafzar.com/form/saderat04');
    script.setAttribute('form-style', 'inline');
    script.setAttribute('form-theme', '');

    containerRef.current.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} />;
}
