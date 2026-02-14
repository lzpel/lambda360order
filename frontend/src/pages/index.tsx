import React from 'react';
import { Link } from 'react-router-dom';

export default function IndexPage() {
    const repo = import.meta.env.BASE_URL.replace(/^\/|\/$/g, '') || 'lambda360order';
    // Usually BASE_URL is /lambda360order/ on GitHub Pages, or / on local.

    return (
        <main style={{ padding: 24, fontFamily: "sans-serif" }}>
            <h1>Lambda360 Order</h1>
            <p>Repository: {repo}</p>
            <p>Select a tool:</p>
            <ul>
                <li>
                    <Link to="/server">3D Viewer (Server)</Link>
                </li>
                <li>
                    <Link to="/order0">Order Page (Mockup)</Link>
                </li>
                <li>
                    <Link to="/insert">Embed/Insert Demo</Link>
                </li>
            </ul>
        </main>
    );
}
