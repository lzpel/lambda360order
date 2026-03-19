import Lambda360Shape from './Lambda360Shape';
import { createClient, createConfig } from '@/out/client/client';
import { actionAction } from '@/out/client';
import type { Input as InputDef, Output as OutputDef } from '@/out/client';

interface OutputProps {
	out: OutputDef;
	serverUrl?: string;
	inputSchema: Record<string, InputDef>;
	values: Record<string, any>;
	outputs: OutputDef[];
}

export default function Output({ out, serverUrl, inputSchema, values, outputs }: OutputProps) {
	if (out.type === 'shape') {
		return (
			<div style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
				<Lambda360Shape
					shape={out.shape}
					backgroundColor="#f5f5f5"
					edgeColor="#333333"
					showEdges={true}
					showViewMenu={true}
					orthographic={true}
					serverUrl={serverUrl}
					axisUp={out.axisUp}
					axisGround={out.axisGround}
					axisCenter={out.axisCenter}
					style={{ width: '100%', height: '100%' }}
				/>
			</div>
		);
	}

	if (out.type === 'border') {
		return <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '8px 0' }} />;
	}

	if (out.type === 'message') {
		const styles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
			error:   { bg: '#fff0f0', border: '#ffcccc', color: '#cc0000', icon: '✕' },
			warning: { bg: '#fffbea', border: '#ffe58f', color: '#ad6800', icon: '⚠' },
			info:	{ bg: '#e8f4fd', border: '#b8daff', color: '#0c5460', icon: 'ℹ' },
			text:	{ bg: '#f8f8f8', border: '#e0e0e0', color: '#333333', icon: '' },
		};
		const s = styles[out.messageType] ?? styles.text;
		return (
			<div style={{
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
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
				<button
					disabled={disabled}
					onClick={() => {
						const baseUrl = serverUrl ? `${serverUrl}/api` : '/api';
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
}
