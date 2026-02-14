import { useEffect, useState } from 'react';
import { DefaultService, OpenAPI } from '../out';

// Configure base URL for API calls
OpenAPI.BASE = '/api';

export default function ServerPage() {
    const [message, setMessage] = useState<string>('Loading...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        DefaultService.helloSayHello()
            .then((response) => {
                setMessage(response);
            })
            .catch((err) => {
                console.error(err);
                setError('Failed to fetch hello message');
                setMessage('');
            });
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>API Client Test</h1>
            {error ? (
                <div style={{ color: 'red' }}>Error: {error}</div>
            ) : (
                <div style={{ fontSize: '1.2em', color: 'green' }}>
                    Response: {message}
                </div>
            )}
        </div>
    );
}
