import {parseIcon} from '@tweeq/core'
import type {HTMLAttributes, SVGAttributes} from 'react'

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'icon'> {
	icon: string
}

const localPaths: Record<string, string> = {
	'mdi:arrow-left-right': 'M7.5 5 3 9.5 7.5 14V11H16.5V14L21 9.5 16.5 5V8H7.5V5Z',
	'mdi:chevron-down': 'M7.4 8.6 12 13.2 16.6 8.6 18 10 12 16 6 10 7.4 8.6Z',
	'mdi:chevron-up': 'M7.4 15.4 12 10.8 16.6 15.4 18 14 12 8 6 14 7.4 15.4Z',
	'mdi:chevron-right': 'M8.6 7.4 13.2 12 8.6 16.6 10 18 16 12 10 6 8.6 7.4Z',
	'mdi:unfold-more-horizontal': 'M7 5 2 10 7 15V12H17V15L22 10 17 5V8H7V5Z',
	'material-symbols:colorize': 'M19.35 2.65 21.35 4.65 13 13H10L5 18 6 19 11 14V11L19.35 2.65ZM4 19 5 20 3 22H1V20L4 19Z',
	'material-symbols:search-rounded': 'M9.5 3A6.5 6.5 0 1 0 13.6 14.55L19.05 20 20.5 18.55 15.05 13.1A6.5 6.5 0 0 0 9.5 3ZM9.5 5A4.5 4.5 0 1 1 9.5 14A4.5 4.5 0 0 1 9.5 5Z',
	'ic:baseline-check-circle': 'M12 2A10 10 0 1 0 12 22A10 10 0 0 0 12 2ZM10 17 5 12 6.4 10.6 10 14.2 17.6 6.6 19 8 10 17Z',
	'ic:baseline-radio-button-unchecked': 'M12 2A10 10 0 1 0 12 22A10 10 0 0 0 12 2ZM12 4A8 8 0 1 1 12 20A8 8 0 0 1 12 4Z',
	'mingcute:dot-grid-fill': 'M5 4A1.5 1.5 0 1 0 5 7A1.5 1.5 0 0 0 5 4ZM12 4A1.5 1.5 0 1 0 12 7A1.5 1.5 0 0 0 12 4ZM19 4A1.5 1.5 0 1 0 19 7A1.5 1.5 0 0 0 19 4ZM5 10.5A1.5 1.5 0 1 0 5 13.5A1.5 1.5 0 0 0 5 10.5ZM12 10.5A1.5 1.5 0 1 0 12 13.5A1.5 1.5 0 0 0 12 10.5ZM19 10.5A1.5 1.5 0 1 0 19 13.5A1.5 1.5 0 0 0 19 10.5ZM5 17A1.5 1.5 0 1 0 5 20A1.5 1.5 0 0 0 5 17ZM12 17A1.5 1.5 0 1 0 12 20A1.5 1.5 0 0 0 12 17ZM19 17A1.5 1.5 0 1 0 19 20A1.5 1.5 0 0 0 19 17Z',
}

export function Icon({icon: source, className, ...props}: IconProps) {
	const icon = parseIcon(source)

	if (icon.type === 'char') {
		return (
			<span
				{...(props as unknown as HTMLAttributes<HTMLSpanElement>)}
				className={className}
				data-tq-component="icon"
				data-tq-variant="char"
			>
				{icon.value}
			</span>
		)
	}

	const path = icon.type === 'fill' ? icon.value : localPaths[icon.value]
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			aria-hidden="true"
			focusable="false"
			{...props}
			className={className}
			data-tq-component="icon"
			data-tq-variant={icon.type === 'fill' ? 'fill' : 'local'}
		>
			{path ? <path fill="currentColor" d={path} /> : <circle cx="12" cy="12" r="2" fill="currentColor" />}
		</svg>
	)
}
