import React, { useState } from 'react'
import { storiesOf } from '@storybook/react'
import { ResizableCssGrid, GridItemConfig } from '../src/ResizableCssGrid'

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
		background: lightgray;
		border: 1px solid darkgray;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;

		resize: both;
		overflow: hidden;
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
		const [layout, setLayout] = useState<GridItemConfig[]>([
			{ columnSpan: 3, rowSpan: 3 },
			{ columnSpan: 3, rowSpan: 3 },
			{ columnSpan: 3, rowSpan: 3 },
			{ columnSpan: 3, rowSpan: 3 },
			{ columnSpan: 3, rowSpan: 3 },
			{ columnSpan: 3, rowSpan: 3 },
			{ columnSpan: 3, rowSpan: 3 },
			{ columnSpan: 3, rowSpan: 3 },
		])
		return (
			<ResizableCssGrid
				className="grid"
				layout={layout}
				onLayoutChange={setLayout}
			>
				<div className="grid-item">Item 1</div>
				<div className="grid-item">Item 2</div>
				<div className="grid-item">Item 3</div>
				<div className="grid-item">Item 4</div>
				<div className="grid-item">Item 5</div>
				<div className="grid-item">Item 6</div>
				<div className="grid-item">Item 7</div>
				<div className="grid-item">Item 8</div>
			</ResizableCssGrid>
		)
	})
