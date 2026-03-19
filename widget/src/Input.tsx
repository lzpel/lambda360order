import type { Input as InputDef } from '@/out/client';

export default function Input(props: {
	name: string;
	def: InputDef;
	value: any;
	onChange: (value: any) => void;
	fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}) {
	const def = props.def;
	if (def.type === 'upload') {
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{def.label}</label>
				<div
					style={{
						border: '2px dashed #ccc',
						borderRadius: '6px',
						padding: '16px',
						textAlign: 'center',
						cursor: 'pointer',
						backgroundColor: props.value ? '#f0f8ff' : '#fafafa',
					}}
					onClick={() => props.fileInputRefs.current[props.name]?.click()}
				>
					{props.value ? (
						<span style={{ fontSize: '13px', color: '#0066cc' }}>
							{typeof props.value === 'string' ? props.value : (props.value as File).name}
						</span>
					) : (
						<span style={{ fontSize: '13px', color: '#999' }}>クリックしてファイルを選択</span>
					)}
				</div>
				<input
					ref={el => { props.fileInputRefs.current[props.name] = el; }}
					type="file"
					accept={def.accept}
					style={{ display: 'none' }}
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) {
							alert(`アップロード機能は未実装です。選択されたファイル: ${file.name}`);
							props.onChange(file);
						}
					}}
				/>
			</div>
		);
	}

	if (def.type === 'text') {
		const variant = def.variant ?? 'text';
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{def.label}</label>
				{variant === 'area' ? (
					<textarea
						value={props.value ?? ''}
						placeholder={def.placeholder}
						onChange={(e) => props.onChange(e.target.value)}
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
						value={props.value ?? ''}
						placeholder={def.placeholder}
						onChange={(e) => props.onChange(e.target.value)}
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
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
						{def.label}{def.unit && <span style={{ color: '#666', fontWeight: 'normal' }}> ({def.unit})</span>}
					</label>
					<select
						value={props.value}
						onChange={(e) => props.onChange(Number(e.target.value))}
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
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'flex', justifyContent: 'space-between' }}>
					<span>{def.label}{def.unit && <span style={{ color: '#666', fontWeight: 'normal' }}> ({def.unit})</span>}</span>
					<span style={{ color: '#333' }}>{props.value}{def.unit ? ` ${def.unit}` : ''}</span>
				</label>
				<input
					type="range"
					min={constraint?.min ?? 0}
					max={constraint?.max ?? 100}
					step={constraint?.step ?? 1}
					value={props.value}
					onChange={(e) => props.onChange(Number(e.target.value))}
					style={{ width: '100%' }}
				/>
			</div>
		);
	}

	if (def.type === 'select') {
		const options = def.options ?? [];
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{def.label}</label>
				<div style={{ display: 'flex', flexDirection: def.horizontal ? 'row' : 'column', gap: '8px', flexWrap: 'wrap' }}>
					{options.map(opt => (
						<label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
							<input
								type="radio"
								name={props.name}
								value={opt.value}
								checked={props.value === opt.value}
								onChange={() => props.onChange(opt.value)}
							/>
							{opt.label}
						</label>
					))}
				</div>
			</div>
		);
	}

	return null;
}
