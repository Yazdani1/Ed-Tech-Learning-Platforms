import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

interface RenderWhenNearViewportProps {
	children: React.ReactNode;
	minHeight?: number | string;
	rootMargin?: string;
}

export default function RenderWhenNearViewport({
	children,
	minHeight = 1,
	rootMargin = '500px',
}: RenderWhenNearViewportProps) {
	const ref = useRef<HTMLDivElement | null>(null);
	const [shouldRender, setShouldRender] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node || shouldRender) return;

		if (!('IntersectionObserver' in window)) {
			setShouldRender(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setShouldRender(true);
					observer.disconnect();
				}
			},
			{ rootMargin },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [rootMargin, shouldRender]);

	return (
		<Box ref={ref} sx={{ minHeight: shouldRender ? undefined : minHeight }}>
			{shouldRender ? children : null}
		</Box>
	);
}
