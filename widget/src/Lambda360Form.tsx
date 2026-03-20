"use client";
import { useState, useMemo, useRef, useCallback } from 'react';
import type { Input, Output } from '@/out/client';
import { createClient, createConfig } from '@/out/client/client';
import { actionAction } from '@/out/client';
import InputField from './Input';
import OutputItem from './Output';

export interface Lambda360FormProps {
	input: Record<string, Input>;
	lambda: (input: Record<string, any>) => Output[];
	serverUrl?: string;
	inputWidth?: number;
	inputSide?: 'left' | 'right';
}

export default function Lambda360Form({ input: inputSchema, lambda, serverUrl, inputWidth = 200, inputSide = 'right' }: Lambda360FormProps) {
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
		setValues(prev => ({ ...prev, [key]: value }));
	};

	const handleAction = useCallback((out: Output) => {
		if (out.type !== 'action') return;
		const baseUrl = serverUrl ? `${serverUrl}/api` : '/api';
		const customClient = createClient(createConfig({ baseUrl }));
		actionAction({ body: { input: inputSchema, value: values, output: outputs, action: out }, client: customClient });
		setSubmitted(true);
	}, [inputSchema, values, outputs, serverUrl]);

	const inputPanel = (
		<div style={{ width: inputWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{Object.entries(inputSchema || {}).map(([key, def]) =>
				<InputField
					key={key}
					name={key}
					def={def}
					value={values[key]}
					onChange={(v) => handleChange(key, v)}
					fileInputRefs={fileInputRefs}
					readOnly={submitted}
				/>
			)}
		</div>
	);

	const visibleOutputs = submitted ? outputs.filter(o => o.type !== 'action') : outputs;

	const outputPanel = (
		<div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
			{visibleOutputs.map((out, i) =>
				<OutputItem
					key={i}
					out={out}
					serverUrl={serverUrl}
					onAction={out.type === 'action' ? () => handleAction(out) : undefined}
				/>
			)}
		</div>
	);

	const panels = inputSide === 'left'
		? <>{inputPanel}{outputPanel}</>
		: <>{outputPanel}{inputPanel}</>;

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
			<div style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-start' }}>
				{panels}
			</div>
		</div>
	);
}
