import React, { useRef, useEffect } from 'react'
import { keyBy } from 'lodash'

interface ItemProps<
	TGridItemElement extends HTMLElement,
	THandleElement extends HTMLElement
>
	extends Pick<
		React.HTMLAttributes<TGridItemElement>,
		'onMouseDown' | 'onMouseUp' | 'onMouseMove' | 'tabIndex' | 'style'
	> {
	ref: React.RefObject<TGridItemElement>
	handleProps: Pick<
		React.HTMLAttributes<THandleElement>,
		'onMouseDown' | 'onMouseUp' | 'onMouseMove' | 'tabIndex'
	> & {
		ref: React.RefObject<THandleElement>
	}
}

type ItemRenderFunction<
	TGridItemElement extends HTMLElement,
	THandleElement extends HTMLElement
> = (props: ItemProps<TGridItemElement, THandleElement>) => React.ReactElement

interface ItemSnapshot {
	readonly key: string
	readonly operation: 'move' | 'resize'
	readonly mouseDownCoordinates: { readonly x: number; readonly y: number }
	readonly sizeOfOneSpan: { readonly row: number; readonly column: number }
	readonly gridItemBounds: DOMRectReadOnly
	readonly activeGridItemElement: HTMLElement
	readonly operatingElement: HTMLElement
}

interface GridItemProps<
	TGridItemElement extends HTMLElement,
	THandleElement extends HTMLElement
> {
	config: GridItemConfig<TGridItemElement, THandleElement>
	onOperationStart: (snapshot: ItemSnapshot) => void
}

function calculateNewSpan(
	updatedCssWidth: number,
	sizeOfOneSpan: number
): number {
	// Calculate new grid config
	// Use Math.ceil so that other grid items move out of the way and never overlay.
	return Math.ceil(updatedCssWidth / sizeOfOneSpan)
}

export function GridItem<
	TGridItemElement extends HTMLElement,
	THandleElement extends HTMLElement
>({
	config,
	onOperationStart,
}: GridItemProps<TGridItemElement, THandleElement>): React.ReactElement {
	const gridItemElementRef = useRef<TGridItemElement | null>(null)
	const handleElementRef = useRef<THandleElement | null>(null)
	const startOperation = (
		event: React.MouseEvent<HTMLElement>,
		operation: 'move' | 'resize'
	) => {
		if (!gridItemElementRef.current) {
			return
		}
		// Prevent selection
		event.preventDefault()
		event.stopPropagation()
		event.currentTarget.setAttribute('aria-grabbed', 'true')
		gridItemElementRef.current.style.zIndex = '1000'
		// Snapshot size, in case the mouse down was on the resize handle.
		const gridItemBounds = gridItemElementRef.current.getBoundingClientRect()
		onOperationStart({
			key: config.key,
			operation,
			operatingElement: event.currentTarget,
			gridItemBounds,
			activeGridItemElement: gridItemElementRef.current,
			mouseDownCoordinates: {
				x: event.screenX,
				y: event.screenY,
			},
			sizeOfOneSpan: {
				column:
					gridItemBounds.width /
					+gridItemElementRef.current.style.gridColumnEnd.slice('span '.length),
				row:
					gridItemBounds.height /
					+gridItemElementRef.current.style.gridRowEnd.slice('span '.length),
			},
		})
	}
	return config.renderItem({
		ref: gridItemElementRef,
		tabIndex: 0,
		style: {
			// TODO lock gridColumnStart of only this element when resizing starts (but free all other elements)?
			// Only possible if we know the grid-column-start & grid-row-start, not possible with auto placement
			gridColumnEnd: `span ${config.columnSpan}`,
			gridRowEnd: `span ${config.rowSpan}`,
		},
		onMouseDown: event => startOperation(event, 'move'),
		handleProps: {
			ref: handleElementRef,
			onMouseDown: event => startOperation(event, 'resize'),
			tabIndex: 0,
		},
	})
}

export interface GridItemLayout {
	readonly columnSpan: number
	readonly rowSpan: number
}

export interface GridItemConfig<
	TGridItemElement extends HTMLElement,
	THandleElement extends HTMLElement
> extends GridItemLayout {
	key: string
	renderItem: ItemRenderFunction<TGridItemElement, THandleElement>
}

export interface ResizableCssGridProps<
	TGridItemElement extends HTMLElement,
	THandleElement extends HTMLElement
> {
	className?: string
	itemClassName?: string
	items: GridItemConfig<TGridItemElement, THandleElement>[]
	onLayoutChange: (
		updatedLayout: GridItemConfig<TGridItemElement, THandleElement>[]
	) => void
}

function findGridItem(
	descendant: Element | null,
	container: HTMLElement
): Element | null {
	if (!descendant) {
		return null
	}
	if (descendant.parentElement === container) {
		return descendant
	}
	return findGridItem(descendant.parentElement, container)
}

export function ResizableCssGrid<
	TGridItemElement extends HTMLElement,
	THandleElement extends HTMLElement
>({
	className,
	items,
	onLayoutChange,
}: ResizableCssGridProps<
	TGridItemElement,
	THandleElement
>): React.ReactElement {
	const mouseDownSnapshotRef = useRef<ItemSnapshot & { index: number }>()
	const itemsByKey = keyBy(items, 'key')
	return (
		<div
			className={className}
			// mousemove needs to be put on the grid container,
			// because the handle can be dragged outside the item.
			onMouseMove={event => {
				console.log('mousemove')
				if (!mouseDownSnapshotRef.current) {
					return
				}

				const mouseDownSnapshot = mouseDownSnapshotRef.current
				const deltaX = event.screenX - mouseDownSnapshot.mouseDownCoordinates.x
				const deltaY = event.screenY - mouseDownSnapshot.mouseDownCoordinates.y

				if (mouseDownSnapshot.operation === 'resize') {
					// Update width and height
					const updatedWidth = mouseDownSnapshot.gridItemBounds.width + deltaX
					mouseDownSnapshot.activeGridItemElement.style.width = `${updatedWidth}px`
					const updatedHeight = mouseDownSnapshot.gridItemBounds.height + deltaY
					mouseDownSnapshot.activeGridItemElement.style.height = `${updatedHeight}px`

					// Update grid spans
					const previousConfig = itemsByKey[mouseDownSnapshot.key]
					const updatedConfig: GridItemConfig<
						TGridItemElement,
						THandleElement
					> = {
						...previousConfig,
						columnSpan: calculateNewSpan(
							updatedWidth,
							mouseDownSnapshot.sizeOfOneSpan.column
						),
						rowSpan: calculateNewSpan(
							updatedHeight,
							mouseDownSnapshot.sizeOfOneSpan.row
						),
					}
					if (
						updatedConfig.columnSpan !== previousConfig.columnSpan ||
						updatedConfig.rowSpan !== previousConfig.rowSpan
					) {
						onLayoutChange([
							...items.slice(0, mouseDownSnapshot.index),
							updatedConfig,
							...items.slice(mouseDownSnapshot.index + 1),
						])
					}
				} else {
					// Move in the grid
					const draggedOverElements = event.currentTarget.ownerDocument.elementsFromPoint(
						event.clientX,
						event.clientY
					)
					const gridContainerElement = event.currentTarget
					// Get the top-most element *below* the grid item we are dragging
					const targetBelow = draggedOverElements.find(
						element =>
							element !== mouseDownSnapshot.activeGridItemElement &&
							!mouseDownSnapshot.activeGridItemElement.contains(element)
					)
					console.log('target below', targetBelow)
					const gridItem = findGridItem(
						targetBelow ?? null,
						gridContainerElement
					)
					if (gridItem) {
						console.log('dragged over grid item', gridItem)
						const draggedOverIndex = [...gridContainerElement.children].indexOf(
							gridItem
						)
						const updatedLayout = [
							...items
								.slice(0, draggedOverIndex)
								.filter(item => item.key !== mouseDownSnapshot.key),
							itemsByKey[mouseDownSnapshot.key], // Insert before dragged over element
							...items
								.slice(draggedOverIndex)
								.filter(item => item.key !== mouseDownSnapshot.key),
						]
						const draggedOverBounds = gridItem.getBoundingClientRect()
						const activeGridItemBounds = mouseDownSnapshot.activeGridItemElement.getBoundingClientRect()
						const offsetX = activeGridItemBounds.x - draggedOverBounds.x
						const offsetY = activeGridItemBounds.y - draggedOverBounds.y
						mouseDownSnapshot.activeGridItemElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`
						onLayoutChange(updatedLayout)
					} else {
						// Update x and y positions
						mouseDownSnapshot.activeGridItemElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`
					}
				}
			}}
			onMouseUp={event => {
				event.persist()
				if (!mouseDownSnapshotRef.current) {
					return
				}
				// Reset element to non-dragging state again
				const mouseDownSnapshot = mouseDownSnapshotRef.current
				mouseDownSnapshot.activeGridItemElement.style.width = ''
				mouseDownSnapshot.activeGridItemElement.style.height = ''
				mouseDownSnapshot.activeGridItemElement.style.zIndex = ''
				mouseDownSnapshot.activeGridItemElement.style.transform = ''
				mouseDownSnapshot.operatingElement.setAttribute('aria-grabbed', 'false')

				mouseDownSnapshotRef.current = undefined
			}}
		>
			{items.map((config, index) => {
				return (
					<GridItem<TGridItemElement, THandleElement>
						key={config.key}
						config={config}
						onOperationStart={snapshot => {
							mouseDownSnapshotRef.current = { ...snapshot, index }
							onLayoutChange([
								...items.slice(0, index),
								config,
								...items.slice(index + 1),
							])
						}}
					/>
				)
			})}
		</div>
	)
}
