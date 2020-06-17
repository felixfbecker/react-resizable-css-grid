import React, { useState, useRef } from 'react'
import { size } from 'lodash'

interface GridItemProps {
	className?: string
	config: GridItemConfig
	onConfigChange: (config: GridItemConfig) => void
	item: React.ReactElement<React.HTMLAttributes<HTMLElement>, string>
}

function calculateNewSpan(
	updatedCssWidth: string,
	sizeOfOneSpan: number
): number {
	const newWidth = parseInt(updatedCssWidth, 10)
	if (isNaN(newWidth)) {
		throw new Error('New width was NaN: ' + updatedCssWidth)
	}
	// Calculate new grid config
	// Use Math.ceil so that other grid items move out of the way and never overlay.
	return Math.ceil(newWidth / sizeOfOneSpan)
}

export const GridItem: React.FunctionComponent<GridItemProps> = ({
	item,
	config,
	onConfigChange,
}) => {
	const sizeOfOneSpan = useRef<{ row: number; column: number }>()
	return React.cloneElement<React.HTMLAttributes<HTMLElement>>(item, {
		style: {
			// TODO lock gridColumnStart of only this element when resizing starts (but free all other elements)
			gridColumnEnd: `span ${config.columnSpan}`,
			gridRowEnd: `span ${config.rowSpan}`,
		},
		onMouseDown: event => {
			// Record size
			const bounds = event.currentTarget.getBoundingClientRect()
			sizeOfOneSpan.current = {
				column:
					bounds.width /
					+event.currentTarget.style.gridColumnEnd.slice('span '.length),
				row:
					bounds.height /
					+event.currentTarget.style.gridRowEnd.slice('span '.length),
			}
			event.currentTarget.style.zIndex = '1000'
		},
		onMouseMove: event => {
			if (!sizeOfOneSpan.current) {
				return
			}
			const target = event.currentTarget
			const updatedConfig: GridItemConfig = {
				columnSpan: calculateNewSpan(
					target.style.width,
					sizeOfOneSpan.current.column
				),
				rowSpan: calculateNewSpan(
					target.style.height,
					sizeOfOneSpan.current.row
				),
			}
			if (
				updatedConfig.columnSpan !== config.columnSpan ||
				updatedConfig.rowSpan !== config.rowSpan
			) {
				onConfigChange(updatedConfig)
			}
		},
		onMouseUp: event => {
			// Clear browser-set size
			event.currentTarget.style.width = ''
			event.currentTarget.style.height = ''
			event.currentTarget.style.zIndex = ''
		},
	})
}

export interface GridItemConfig {
	columnSpan: number
	rowSpan: number
}

export interface ResizableCssGridProps {
	className?: string
	itemClassName?: string
	children: React.ReactElement<React.HTMLAttributes<HTMLElement>, string>[]
	layout: GridItemConfig[]
	onLayoutChange: (updatedLayout: GridItemConfig[]) => void
}

export const ResizableCssGrid: React.FunctionComponent<ResizableCssGridProps> = ({
	layout,
	className,
	children,
	onLayoutChange,
}: ResizableCssGridProps) => {
	if (React.Children.count(children) !== layout.length) {
		throw new Error(
			`Invalid number of children passed, expected ${layout.length}`
		)
	}
	return (
		<div className={className}>
			{React.Children.map(children, (child, index) => {
				const gridItemConfig = layout[index]
				return (
					<GridItem
						config={gridItemConfig}
						onConfigChange={config =>
							onLayoutChange([
								...layout.slice(0, index),
								config,
								...layout.slice(index + 1),
							])
						}
						item={child}
					/>
				)
			})}
		</div>
	)
}
