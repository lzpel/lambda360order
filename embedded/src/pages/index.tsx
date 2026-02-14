import React from 'react';
import OrderWidget from '../OrderWidget';

export default function IndexPage() {
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white' }}>
                Lambda360 App - Index
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                <OrderWidget modelUrl="https://lzpel.github.io/lambda360order/PA-001-DF7.json" />
            </div>
        </div>
    );
}
