import Lambda360Shape from './Lambda360Shape';
import type { Output as OutputDef } from '@/out/client';

export default function Output(props: {
	out: OutputDef;
	serverUrl?: string;
	onAction?: () => void;
}) {
	if (props.out.type === 'shape') {
		return (
			<Lambda360Shape
				shape={props.out.shape}
				backgroundColor="white"
				edgeColor="#333333"
				showEdges={true}
				showViewMenu={true}
				orthographic={true}
				serverUrl={props.serverUrl}
				axisUp={props.out.axisUp}
				axisGround={props.out.axisGround}
				axisCenter={props.out.axisCenter}
				annotations={props.out.annotations?.map(a =>
					a.type === 'point'
						? { ...a, position: [a.position[0], a.position[1], a.position[2]] as [number, number, number] }
						: { ...a, start: [a.start[0], a.start[1], a.start[2]] as [number, number, number], end: [a.end[0], a.end[1], a.end[2]] as [number, number, number] }
				)}
				style={{ width: '100%', maxHeight: '500px', aspectRatio: '4/4', borderRadius: '8px', border: '1px solid #ddd' }}
			/>
		);
	}

	if (props.out.type === 'border') {
		return <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '8px 0' }} />;
	}

	if (props.out.type === 'message') {
		const styles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
			error: { bg: '#fff0f0', border: '#ffcccc', color: '#cc0000', icon: '✕' },
			warning: { bg: '#fffbea', border: '#ffe58f', color: '#ad6800', icon: '⚠' },
			info: { bg: '#e8f4fd', border: '#b8daff', color: '#0c5460', icon: 'ℹ' },
			text: { bg: '#f8f8f8', border: '#e0e0e0', color: '#333333', icon: '' },
		};
		const s = styles[props.out.messageType] ?? styles.text;
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
				<span>{props.out.label}</span>
			</div>
		);
	}

	if (props.out.type === 'action') {
		const disabled = !!props.out.disable;
		const disableReason = typeof props.out.disable === 'string' ? props.out.disable : undefined;
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
				<button
					disabled={disabled}
					onClick={props.onAction}
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
					{props.out.label}
				</button>
				{disableReason && (
					<span style={{ fontSize: '13px', color: '#cc0000' }}>{disableReason}</span>
				)}
			</div>
		);
	}

	return null;
}
