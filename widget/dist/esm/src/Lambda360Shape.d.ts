import { ComponentProps } from 'react';
import { Lambda360View } from 'lambda360view';
import { ShapeNode } from '../out/client';
export interface Lambda360ShapeProps extends Omit<ComponentProps<typeof Lambda360View>, 'model'> {
    shape: ShapeNode;
    origin_url?: string;
}
export default function Lambda360Shape({ shape, origin_url, ...props }: Lambda360ShapeProps): import("react/jsx-runtime").JSX.Element;
