import React, { useState } from 'react'
import { storiesOf } from '@storybook/react'
import {
	ResizableCssGrid,
	GridItemLayout,
	GridItemConfig,
} from '../ResizableCssGrid'
import { range } from 'lodash'

const styles = `
	body {
		font-family: system-ui, sans-serif;
	}
	* {
		box-sizing: border-box;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(12, 3fr);
		grid-auto-rows: 5rem;
		gap: 0.5rem;
		position: relative;
	}
	.grid-item {
		position: relative;
		background: lightgray;
		border: 1px solid darkgray;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.handle {
		border-right: 2px solid gray;
		border-bottom: 2px solid gray;
		width: 0.75rem;
		height: 0.75rem;
		position: absolute;
		right: 0.25rem;
		bottom: 0.25rem;
		outline: none;
		cursor: nwse-resize;
	}
	.handle:focus {
		border-color: blue;
	}
`

storiesOf('ResizableCssGrid', module)
	.addDecorator(story => (
		<>
			<style>{styles}</style>
			{story()}
		</>
	))
	.add('Test', () => {
		const [items, setItems] = useState<
			GridItemConfig<HTMLDivElement, HTMLDivElement>[]
		>(
			range(1, 8).map(number => ({
				columnSpan: 3,
				rowSpan: 3,
				key: number.toString(),
				renderItem: ({ handleProps, ...itemProps }) => (
					<div
						className="grid-item"
						{...itemProps}
						data-key={number.toString()}
					>
						Item {number}
						<div className="handle" {...handleProps} />
					</div>
				),
			}))
		)
		return (
			<ResizableCssGrid<HTMLDivElement, HTMLDivElement>
				className="grid"
				onLayoutChange={setItems}
				items={items}
			/>
		)
	})
