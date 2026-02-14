import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import routes from '~react-pages';

function App() {
  const element = useRoutes(routes);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {element}
    </Suspense>
  );
}

const container = document.getElementById('root') || document.body.appendChild(document.createElement('div'));
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
