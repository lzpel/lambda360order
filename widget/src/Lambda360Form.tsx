"use client";
import { useState, useMemo, useRef, useCallback, CSSProperties } from 'react';
import type { Input, Output } from '@/out/client';
import { actionAction } from '@/out/client';
import { createClient, createConfig } from '@/out/client/client';
export type * from '@/out/client';
import InputField from './Input';
import OutputItem from './Output';

export type Lambda = (input: Record<string, Input>) => Output[];

export interface Lambda360FormProps {
    input: Record<string, Input>;
    lambda: Lambda;
    serverUrl?: string;
    sideWidth?: number;
    side?: 'left' | 'right' | 'none';
}

export default function Lambda360Form({
    input: inputSchema,
    lambda, serverUrl,
    sideWidth = 200,
    side = 'right'
}: Lambda360FormProps) {
    const [values, setValues] = useState<Record<string, Input>>(inputSchema);

    const [submitted, setSubmitted] = useState(false);
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const outputs = useMemo(() => {
        try {
            return lambda(values);
        } catch (e) {
            console.error("Lambda function evaluation failed:", e);
            return [];
        }
    }, [lambda, values]);

    const handleChange = (key: string, value: any) => {
        setValues(prev => ({ ...prev, [key]: { ...prev[key], value } as Input }));
    };

    const handleAction = useCallback((out: Output) => {
        if (out.type !== 'action') return;
        const baseUrl = serverUrl ? `${serverUrl}/api` : '/api';
        const customClient = createClient(createConfig({ baseUrl }));
        actionAction({ body: { input: inputSchema, output: outputs, action: out }, client: customClient });
        setSubmitted(true);
    }, [inputSchema, values, outputs, serverUrl]);

    const style_base: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' }
    const style_main: CSSProperties = { width: '100%', flex: 1, minWidth: 0, ...style_base }
    const style_side: CSSProperties = { width: sideWidth, flexShrink: 0, ...style_base }

    return (
        <div style={{
            width: '100%',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '24px',
            boxSizing: 'border-box',
        }}>
            {submitted && (
                <div style={{ fontSize: '14px', color: '#333', textAlign: 'center' }}>
                    回答を送信しました。
                    <button
                        onClick={() => setSubmitted(false)}
                        style={{
                            marginLeft: '12px',
                            background: 'none',
                            border: 'none',
                            color: '#0066cc',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: 0,
                            textDecoration: 'underline',
                        }}
                    >
                        別の回答を送信
                    </button>
                </div>
            )}
            <div style={{
                display: 'flex',
                flexDirection: side == "none" ? 'column' : side == "left" ? 'row' : 'row-reverse',
                gap: '16px',
                alignItems: 'flex-start'
            }}>
                <div style={side == "none" ? style_main : style_side}>
                    {Object.entries(inputSchema || {}).map(([key, def]) =>
                        <InputField
                            key={key}
                            name={key}
                            def={def}
                            value={(values[key] as any).value}
                            onChange={(v) => handleChange(key, v)}
                            fileInputRefs={fileInputRefs}
                            readOnly={submitted}
                        />
                    )}
                </div>
                <div style={style_main}>
                    {outputs.filter(o => !(submitted && o.type === 'action')).map((out, i) =>
                        <OutputItem
                            key={i}
                            out={out}
                            serverUrl={serverUrl}
                            onAction={out.type === 'action' ? () => handleAction(out) : undefined}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
