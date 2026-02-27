import React from 'react';
import { createRoot } from 'react-dom/client';
import Lambda360Order from './Lambda360Order';
import type { Lambda360OrderProps } from './Lambda360Order';

function mount(container: HTMLElement, options?: { modelUrl?: string }) {
  console.warn("Lambda360.mount is deprecated. Please use Lambda360.initLambda360 instead.");
  return null;
}

function initLambda360(selector: string | HTMLElement, options: Lambda360OrderProps) {
  const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!container) {
    console.error(`Lambda360: Container not found for selector '${selector}'`);
    return null;
  }
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Lambda360Order params={options.params} lambda={options.lambda} origin_url={options.origin_url || "https://dfrujiq0byx89.cloudfront.net"} />
    </React.StrictMode>
  );
  return root;
}

// Global API
(window as any).Lambda360 = { mount, initLambda360 };
