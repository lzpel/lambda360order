import type { Input as InputDef } from '@/out/client';

interface InputProps {
    name: string;
    def: InputDef;
    value: any;
    onChange: (value: any) => void;
    fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}

export default function Input({ name, def, value, onChange, fileInputRefs }: InputProps) {
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
                        backgroundColor: value ? '#f0f8ff' : '#fafafa',
                    }}
                    onClick={() => fileInputRefs.current[name]?.click()}
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
                    ref={el => { fileInputRefs.current[name] = el; }}
                    type="file"
                    accept={def.accept}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            alert(`アップロード機能は未実装です。選択されたファイル: ${file.name}`);
                            onChange(file);
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
                        value={value ?? ''}
                        placeholder={def.placeholder}
                        onChange={(e) => onChange(e.target.value)}
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
                        onChange={(e) => onChange(e.target.value)}
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
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
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
                    <span style={{ color: '#333' }}>{value}{def.unit ? ` ${def.unit}` : ''}</span>
                </label>
                <input
                    type="range"
                    min={constraint?.min ?? 0}
                    max={constraint?.max ?? 100}
                    step={constraint?.step ?? 1}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    style={{ width: '100%' }}
                />
            </div>
        );
    }

    if (def.type === 'select') {
        const options = def.options ?? [];
        const useButtons = options.length <= 5;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{def.label}</label>
                {useButtons ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => onChange(opt.value)}
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
                        onChange={(e) => onChange(e.target.value)}
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
}
