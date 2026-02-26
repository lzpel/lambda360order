"use client";
import { useState, useMemo } from 'react';
import Lambda360Shape from './Lambda360Shape';

interface ParamConfig {
    type: 'number' | 'color';
    label: string;
    unit?: string;
    default: any;
    constraint?: {
        min?: number;
        max?: number;
        step?: number;
        enum?: any[];
    };
}

import type { ShapeNode } from '@/out/client';

export interface OrderConfig {
    params: Record<string, ParamConfig>;
    shape: ShapeNode;
    color?: string;
    pricing?: any;
}

interface Lambda360OrderProps {
    order: OrderConfig;
}

// 簡易な式評価関数。 '$width - 200' などの文字列を params の値を用いて評価する。
function evaluateExpression(expr: string, context: Record<string, any>): any {
    // $var を var に置換
    const cleanExpr = expr.replace(/\$(\w+)/g, '$1');
    const keys = Object.keys(context);
    const values = Object.values(context);
    try {
        const fn = new Function(...keys, `return ${cleanExpr};`);
        return fn(...values);
    } catch (e) {
        console.warn(`Evaluation failed for expression: ${expr}`, e);
        return expr;
    }
}

// JSONツリー全体を再帰的にトラバースして式を評価する
function evaluateTree(obj: any, context: Record<string, any>): any {
    if (typeof obj === 'string') {
        if (obj.includes('$')) {
            return evaluateExpression(obj, context);
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => evaluateTree(item, context));
    }
    if (obj !== null && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = evaluateTree(value, context);
        }
        return result;
    }
    return obj;
}

export default function Lambda360Order({ order }: Lambda360OrderProps) {
    // 初期値でstateを初期化
    const [paramValues, setParamValues] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        for (const [key, config] of Object.entries(order.params || {})) {
            initial[key] = config.default;
        }
        return initial;
    });

    // stateが変更されるたびにshapeを再評価
    const evaluatedShape = useMemo(() => {
        let shape = evaluateTree(order.shape, paramValues);
        // FIXME: color is not supported yet
        // if (order.color) {
        //     const colorValue = evaluateTree(order.color, paramValues);
        //     shape = {
        //         op: 'color',
        //         color: colorValue,
        //         shape: shape
        //     };
        // }
        return shape as ShapeNode;
    }, [order.shape, order.color, paramValues]);

    const handleChange = (key: string, value: any) => {
        setParamValues(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            minHeight: '600px',
            margin: 0,
            padding: 0,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
        }}>
            {/* Left: 3D Viewer */}
            <div style={{ flex: 1, position: 'relative', backgroundColor: '#f5f5f5', borderRight: '1px solid #ddd', minWidth: 0, minHeight: 0 }}>
                <Lambda360Shape shape={evaluatedShape} upAxis="Z" />
            </div>

            {/* Right: Order Form */}
            <div style={{
                width: '400px',
                backgroundColor: '#ffffff',
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a' }}>
                        セミカスタムオーダー
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        パラメータを指定して3Dモデルを動的に生成します。
                    </p>
                </div>

                {/* Dynamic Form Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(order.params || {}).map(([key, config]) => {
                        const currentValue = paramValues[key];

                        return (
                            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{config.label} <span style={{ color: '#666', fontWeight: 'normal' }}>({key})</span></span>
                                    {config.type === 'number' && <span>{currentValue} {config.unit}</span>}
                                </label>

                                {config.constraint?.enum ? (
                                    // Select box for enum
                                    <select
                                        value={currentValue}
                                        onChange={(e) => {
                                            const val = config.type === 'number' ? Number(e.target.value) : e.target.value;
                                            handleChange(key, val);
                                        }}
                                        style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            backgroundColor: '#fff',
                                        }}
                                    >
                                        {config.constraint.enum.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : config.type === 'number' ? (
                                    // Range slider for number
                                    <input
                                        type="range"
                                        min={config.constraint?.min ?? 0}
                                        max={config.constraint?.max ?? 100}
                                        step={config.constraint?.step ?? 1}
                                        value={currentValue}
                                        onChange={(e) => handleChange(key, Number(e.target.value))}
                                        style={{ width: '100%' }}
                                    />
                                ) : config.type === 'color' ? (
                                    // Color picker
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="color"
                                            value={currentValue}
                                            onChange={(e) => handleChange(key, e.target.value)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                padding: '0',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <span style={{ fontSize: '14px', color: '#666' }}>{currentValue}</span>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <button style={{
                        width: '100%',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        padding: '14px',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        cursor: 'pointer',
                    }}>
                        発注へ進む
                    </button>
                </div>
            </div>
        </div>
    );
}
