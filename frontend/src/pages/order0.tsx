import React from 'react';
import OrderWidget from '../OrderWidget';

export default function OrderPage() {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
    const modelUrl = `${baseUrl}PA-001-DF7.json`;

    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
            <OrderWidget modelUrl={modelUrl} />
        </div>
    );
}
