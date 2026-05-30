import { type FC, useCallback, useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';

type ClockMode = 'hours' | 'minutes' | 'seconds';

export interface DurationValue {
	hours: number;
	minutes: number;
	seconds: number;
}

interface DurationClockPickerProps {
	value: DurationValue;
	onChange: (v: DurationValue) => void;
}

const SVG_SIZE = 268;
const CENTER = SVG_SIZE / 2;
const OUTER_R = 104;
const INNER_R = 68;
const ACCENT = '#2196f3';

const toXY = (angleDeg: number, r: number) => ({
	x: CENTER + r * Math.sin((angleDeg * Math.PI) / 180),
	y: CENTER - r * Math.cos((angleDeg * Math.PI) / 180),
});

const fmtU = (n: number) => String(n).padStart(2, '0');

const DurationClockPicker: FC<DurationClockPickerProps> = ({ value, onChange }) => {
	const [mode, setMode] = useState<ClockMode>('hours');

	/* ── hand position ─────────────────────────────────────────────── */
	const handProps = (() => {
		if (mode === 'hours') {
			const v = value.hours;
			const isInner = v === 0 || v > 12;
			return { angle: v === 0 ? 0 : (v % 12) * 30, radius: isInner ? INNER_R : OUTER_R };
		}
		const v = mode === 'minutes' ? value.minutes : value.seconds;
		return { angle: (v / 60) * 360, radius: OUTER_R };
	})();

	const handEnd = toXY(handProps.angle, handProps.radius);
	const activeVal = mode === 'hours' ? value.hours : mode === 'minutes' ? value.minutes : value.seconds;

	/* ── numbers ────────────────────────────────────────────────────── */
	const numbers =
		mode === 'hours'
			? Array.from({ length: 12 }, (_, i) => [
					{ label: i === 0 ? '12' : String(i), value: i === 0 ? 12 : i, isInner: false, angle: i * 30 },
					{ label: i === 0 ? '0' : String(i + 12), value: i === 0 ? 0 : i + 12, isInner: true, angle: i * 30 },
			  ]).flat()
			: Array.from({ length: 12 }, (_, i) => ({
					label: fmtU(i * 5),
					value: i * 5,
					isInner: false,
					angle: i * 30,
			  }));

	/* ── tick marks ─────────────────────────────────────────────────── */
	const ticks = Array.from({ length: 60 }, (_, i) => {
		const a = (i / 60) * 360;
		const isMajor = i % 5 === 0;
		const p1 = toXY(a, CENTER - 5);
		const p2 = toXY(a, CENTER - (isMajor ? 15 : 9));
		return { ...p1, x2: p2.x, y2: p2.y, opacity: isMajor ? 0.22 : 0.08 };
	});

	/* ── click handler ──────────────────────────────────────────────── */
	const handleClick = useCallback(
		(e: React.MouseEvent<SVGSVGElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const scale = SVG_SIZE / rect.width;
			const x = (e.clientX - rect.left) * scale - CENTER;
			const y = (e.clientY - rect.top) * scale - CENTER;
			const dist = Math.sqrt(x * x + y * y);
			const angleDeg = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;

			if (mode === 'hours') {
				const pos = Math.round(angleDeg / 30) % 12;
				const isInner = dist < (OUTER_R + INNER_R) / 2;
				const v = isInner ? (pos === 0 ? 0 : pos + 12) : pos === 0 ? 12 : pos;
				onChange({ ...value, hours: Math.min(23, v) });
				setMode('minutes');
			} else if (mode === 'minutes') {
				onChange({ ...value, minutes: Math.round(angleDeg / 6) % 60 });
				setMode('seconds');
			} else {
				onChange({ ...value, seconds: Math.round(angleDeg / 6) % 60 });
			}
		},
		[mode, value, onChange],
	);

	const modeBtnSx = (m: ClockMode) => ({
		px: 1.5,
		py: 0.5,
		borderRadius: 1.5,
		fontFamily: '"Courier New", monospace',
		fontSize: '2rem',
		fontWeight: 700,
		letterSpacing: '0.04em',
		minWidth: 70,
		textAlign: 'center' as const,
		color: mode === m ? '#fff' : 'text.secondary',
		bgcolor: mode === m ? ACCENT : 'transparent',
		transition: 'background 0.15s, color 0.15s',
		'&:hover': { bgcolor: mode === m ? '#1976d2' : 'action.hover' },
	});

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
			{/* HH : MM : SS — click a unit to switch mode */}
			<Box sx={{ display: 'flex', alignItems: 'center' }}>
				<ButtonBase onClick={() => setMode('hours')} sx={modeBtnSx('hours')}>
					{fmtU(value.hours)}
				</ButtonBase>
				<Typography sx={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 700, color: 'text.disabled', mx: 0.25 }}>
					:
				</Typography>
				<ButtonBase onClick={() => setMode('minutes')} sx={modeBtnSx('minutes')}>
					{fmtU(value.minutes)}
				</ButtonBase>
				<Typography sx={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 700, color: 'text.disabled', mx: 0.25 }}>
					:
				</Typography>
				<ButtonBase onClick={() => setMode('seconds')} sx={modeBtnSx('seconds')}>
					{fmtU(value.seconds)}
				</ButtonBase>
			</Box>

			<Typography variant='caption' sx={{ color: 'text.disabled', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 10 }}>
				tap clock to set {mode}
			</Typography>

			{/* ── SVG clock face ──────────────────────────────────────── */}
			<Box
				sx={{
					borderRadius: '50%',
					boxShadow: `0 0 0 3px ${ACCENT}55, 0 8px 32px rgba(0,0,0,0.5)`,
					lineHeight: 0,
				}}
			>
				<svg
					width={SVG_SIZE}
					height={SVG_SIZE}
					viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
					onClick={handleClick}
					style={{ cursor: 'pointer', borderRadius: '50%', display: 'block' }}
				>
					{/* Face */}
					<circle cx={CENTER} cy={CENTER} r={CENTER - 1} fill='#0d1117' />

					{/* Bezel ring */}
					<circle cx={CENTER} cy={CENTER} r={CENTER - 1} fill='none' stroke={`${ACCENT}44`} strokeWidth={1.5} />

					{/* Tick marks */}
					{ticks.map((t, i) => (
						<line
							key={i}
							x1={t.x} y1={t.y}
							x2={t.x2} y2={t.y2}
							stroke={`rgba(255,255,255,${t.opacity})`}
							strokeWidth={i % 5 === 0 ? 1.5 : 1}
						/>
					))}

					{/* Inner ring guide (hours only) */}
					{mode === 'hours' && (
						<>
							<circle cx={CENTER} cy={CENTER} r={INNER_R + 14} fill='rgba(255,255,255,0.025)' />
							<circle cx={CENTER} cy={CENTER} r={INNER_R - 14} fill='#0d1117' />
						</>
					)}

					{/* Hand shadow */}
					<line
						x1={CENTER} y1={CENTER} x2={handEnd.x} y2={handEnd.y}
						stroke='rgba(0,0,0,0.45)' strokeWidth={5} strokeLinecap='round'
					/>
					{/* Hand */}
					<line
						x1={CENTER} y1={CENTER} x2={handEnd.x} y2={handEnd.y}
						stroke={ACCENT} strokeWidth={2.5} strokeLinecap='round'
					/>
					{/* Hand knob */}
					<circle cx={handEnd.x} cy={handEnd.y} r={15} fill={ACCENT} />
					{/* Hand knob inner */}
					<circle cx={handEnd.x} cy={handEnd.y} r={9} fill='rgba(255,255,255,0.25)' />

					{/* Numbers */}
					{numbers.map((n) => {
						const pos = toXY(n.angle, n.isInner ? INNER_R : OUTER_R);
						const selected = n.value === activeVal;
						return (
							<g key={`${n.isInner ? 'i' : 'o'}-${n.value}`}>
								{selected && <circle cx={pos.x} cy={pos.y} r={15} fill={ACCENT} />}
								<text
									x={pos.x}
									y={pos.y}
									textAnchor='middle'
									dominantBaseline='central'
									fill={selected ? '#fff' : `rgba(255,255,255,${n.isInner ? 0.5 : 0.85})`}
									fontSize={n.isInner ? 11 : 13}
									fontWeight={selected ? '700' : '400'}
									style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: 'system-ui, sans-serif' }}
								>
									{n.label}
								</text>
							</g>
						);
					})}

					{/* Center cap */}
					<circle cx={CENTER} cy={CENTER} r={5} fill={ACCENT} />
					<circle cx={CENTER} cy={CENTER} r={2} fill='#fff' />
				</svg>
			</Box>

			{mode === 'hours' && (
				<Typography variant='caption' sx={{ color: 'text.disabled', fontSize: 10 }}>
					Outer: 1–12 · Inner: 0, 13–23
				</Typography>
			)}
		</Box>
	);
};

export default DurationClockPicker;
