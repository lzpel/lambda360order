import { ShapeNode } from '../out/client';
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
export interface Lambda360FormProps {
    params: Record<string, ParamConfig>;
    lambda: (params: Record<string, any>) => {
        shape: ShapeNode;
        color?: string;
        price?: number;
    };
    origin_url?: string;
}
export default function Lambda360Form({ params: schemaParams, lambda, origin_url }: Lambda360FormProps): import("react/jsx-runtime").JSX.Element;
export {};
