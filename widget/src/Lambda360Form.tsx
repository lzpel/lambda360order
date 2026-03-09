"use client";
import { useState, useMemo, useRef } from 'react';
import Lambda360Shape from './Lambda360Shape';
import { createClient, createConfig } from '@/out/client/client';
import { actionAction } from '@/out/client';
import type { Input, Output } from '@/out/client';

export interface Lambda360FormProps {
    input: Record<string, Input>;
    lambda: (input: Record<string, any>) => Output[];
    origin_url?: string;
}

export default function Lambda360Form({ input: inputSchema, lambda, origin_url }: Lambda360FormProps) {
    const [values, setValues] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        for (const [key, def] of Object.entries(inputSchema || {})) {
            if (def.type === 'number' || def.type === 'text' || def.type === 'select') {
                initial[key] = (def as any).default ?? (def.type === 'number' ? 0 : '');
            } else {
                initial[key] = null;
            }
        }
        return initial;
    });

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
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const renderInput = (key: string, def: Input) => {
        const value = values[key];

        if (def.type === 'upload') {
            return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{def.label}</label>
                    <div
                        style={{
                            border: '2px dashed #ccc',
                            borderRadius: '6px',
                            padding: '16px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: value ? '#f0f8ff' : '#fafafa',
                        }}
                        onClick={() => fileInputRefs.current[key]?.click()}
                    >
                        {value ? (
                            <span style={{ fontSize: '13px', color: '#0066cc' }}>
                                {typeof value === 'string' ? value : (value as File).name}
                            </span>
                        ) : (
                            <span style={{ fontSize: '13px', color: '#999' }}>クリックしてファイルを選択</span>
                        )}
                    </div>
                    <input
                        ref={el => { fileInputRefs.current[key] = el; }}
                        type="file"
                        accept={def.accept}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                alert(`アップロード機能は未実装です。選択されたファイル: ${file.name}`);
                                handleChange(key, file);
                            }
                        }}
                    />
                </div>
            );
        }

        if (def.type === 'text') {
            const variant = def.variant ?? 'text';
            return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{def.label}</label>
                    {variant === 'area' ? (
                        <textarea
                            value={value ?? ''}
                            placeholder={def.placeholder}
                            onChange={(e) => handleChange(key, e.target.value)}
                            rows={4}
                            style={{
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                resize: 'vertical',
                            }}
                        />
                    ) : (
                        <input
                            type={variant === 'email' ? 'email' : 'text'}
                            value={value ?? ''}
                            placeholder={def.placeholder}
                            onChange={(e) => handleChange(key, e.target.value)}
                            style={{
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                            }}
                        />
                    )}
                </div>
            );
        }

        if (def.type === 'number') {
            const constraint = def.constraint as any;
            if (constraint?.enum) {
                return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                            {def.label}{def.unit && <span style={{ color: '#666', fontWeight: 'normal' }}> ({def.unit})</span>}
                        </label>
                        <select
                            value={value}
                            onChange={(e) => handleChange(key, Number(e.target.value))}
                            style={{
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: '#fff',
                            }}
                        >
                            {constraint.enum.map((opt: number) => (
                                <option key={opt} value={opt}>{opt}{def.unit ? ` ${def.unit}` : ''}</option>
                            ))}
                        </select>
                    </div>
                );
            }
            return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{def.label}{def.unit && <span style={{ color: '#666', fontWeight: 'normal' }}> ({def.unit})</span>}</span>
                        <span style={{ color: '#333' }}>{value}{def.unit ? ` ${def.unit}` : ''}</span>
                    </label>
                    <input
                        type="range"
                        min={constraint?.min ?? 0}
                        max={constraint?.max ?? 100}
                        step={constraint?.step ?? 1}
                        value={value}
                        onChange={(e) => handleChange(key, Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
            );
        }

        if (def.type === 'select') {
            const options = def.options ?? [];
            const useButtons = options.length <= 5;
            return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{def.label}</label>
                    {useButtons ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {options.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleChange(key, opt.value)}
                                    style={{
                                        padding: '8px 16px',
                                        border: '1px solid',
                                        borderColor: value === opt.value ? '#0066cc' : '#ddd',
                                        borderRadius: '6px',
                                        backgroundColor: value === opt.value ? '#e8f0fe' : '#fff',
                                        color: value === opt.value ? '#0066cc' : '#333',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        fontWeight: value === opt.value ? '600' : 'normal',
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <select
                            value={value ?? ''}
                            onChange={(e) => handleChange(key, e.target.value)}
                            style={{
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: '#fff',
                            }}
                        >
                            {options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    )}
                </div>
            );
        }

        return null;
    };

    const renderOutput = (out: Output, index: number) => {
        if (out.type === 'shape') {
            return (
                <div key={index} style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                    <Lambda360Shape
                        shape={out.shape}
                        backgroundColor="#f5f5f5"
                        edgeColor="#333333"
                        showEdges={true}
                        showViewMenu={true}
                        orthographic={true}
                        preserveCamera={true}
                        origin_url={origin_url}
                        upAxis="Z"
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            );
        }

        if (out.type === 'border') {
            return <hr key={index} style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '8px 0' }} />;
        }

        if (out.type === 'message') {
            const styles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
                error:   { bg: '#fff0f0', border: '#ffcccc', color: '#cc0000', icon: '✕' },
                warning: { bg: '#fffbea', border: '#ffe58f', color: '#ad6800', icon: '⚠' },
                info:    { bg: '#e8f4fd', border: '#b8daff', color: '#0c5460', icon: 'ℹ' },
                text:    { bg: '#f8f8f8', border: '#e0e0e0', color: '#333333', icon: '' },
            };
            const s = styles[out.messageType] ?? styles.text;
            return (
                <div key={index} style={{
                    padding: '12px 16px',
                    backgroundColor: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: '6px',
                    color: s.color,
                    fontSize: '14px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                }}>
                    {s.icon && <span style={{ flexShrink: 0 }}>{s.icon}</span>}
                    <span>{out.label}</span>
                </div>
            );
        }

        if (out.type === 'action') {
            const disabled = !!out.disable;
            const disableReason = typeof out.disable === 'string' ? out.disable : undefined;
            return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                        disabled={disabled}
                        onClick={() => {
                            const baseUrl = origin_url ? `${origin_url}/api` : '/api';
                            const customClient = createClient(createConfig({ baseUrl }));
                            const inputWithValues = Object.fromEntries(
                                Object.entries(inputSchema).map(([key, def]) => [key, { ...def, value: values[key] }])
                            );
                            actionAction({
                                body: { input: inputWithValues, output: outputs, action: out },
                                client: customClient,
                            });
                        }}
                        style={{
                            width: '100%',
                            backgroundColor: disabled ? '#aaa' : '#0066cc',
                            color: 'white',
                            padding: '14px',
                            borderRadius: '6px',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {out.label}
                    </button>
                    {disableReason && (
                        <span style={{ fontSize: '13px', color: '#cc0000' }}>{disableReason}</span>
                    )}
                </div>
            );
        }

        return null;
    };

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
            {/* Input section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(inputSchema || {}).map(([key, def]) => renderInput(key, def))}
            </div>

            {/* Output section */}
            {outputs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {outputs.map((out, i) => renderOutput(out, i))}
                </div>
            )}
        </div>
    );
}
