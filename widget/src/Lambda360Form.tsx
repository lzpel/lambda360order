"use client";
import { useState, useMemo, useRef } from 'react';
import type { Input, Output } from '@/out/client';
import InputField from './Input';
import OutputItem from './Output';

export interface Lambda360FormProps {
	input: Record<string, Input>;
	lambda: (input: Record<string, any>) => Output[];
	serverUrl?: string;
}

export default function Lambda360Form({ input: inputSchema, lambda, serverUrl }: Lambda360FormProps) {
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
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				{Object.entries(inputSchema || {}).map(([key, def]) =>
					<InputField key={key} name={key} def={def} value={values[key]} onChange={(v) => handleChange(key, v)} fileInputRefs={fileInputRefs} />
				)}
			</div>
			{outputs.length > 0 && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
					{outputs.map((out, i) =>
						<OutputItem key={i} out={out} serverUrl={serverUrl} inputSchema={inputSchema} values={values} outputs={outputs} />
					)}
				</div>
			)}
		</div>
	);
}
