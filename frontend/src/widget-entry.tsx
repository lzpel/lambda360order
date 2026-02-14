import React from 'react';
import { createRoot } from 'react-dom/client';
import OrderWidget from './OrderWidget';

const DEFAULT_MODEL_URL = 'https://lzpel.github.io/lambda360order/PA-001-DF7.json';

function mount(container: HTMLElement, options?: { modelUrl?: string }) {
  const modelUrl = options?.modelUrl
    ?? container.dataset.model
    ?? DEFAULT_MODEL_URL;

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <OrderWidget modelUrl={modelUrl} />
    </React.StrictMode>
  );
  return root;
}

// Auto-mount: find containers with id or data attribute
(function autoMount() {
  const container = document.getElementById('lambda360-order');
  if (container) {
    mount(container);
  }

  // Also mount to any element with data-lambda360-order attribute
  document.querySelectorAll<HTMLElement>('[data-lambda360-order]').forEach(el => {
    mount(el);
  });
})();

// Expose global API for manual mounting
(window as any).Lambda360Order = { mount };
