/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable no-useless-call */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { fabric } from 'fabric';
import tinycolor from 'tinycolor2';
import { markRaw } from 'vue';
import useArrow from './arrow';

useArrow(fabric);

function debounce(callback: Function, wait: number) {
	let timeoutId: number;

	return (...args: any) => {
		window.clearTimeout(timeoutId);

		timeoutId = window.setTimeout(() => {
			callback(...args);
		}, wait);
	};
}

const getStyleVar = (name: string) => getComputedStyle(document.querySelector('#app') as Element).getPropertyValue(name);

export class Whiteboard {
	canvas: any;
	selectedShapeType: string = 'none';
	currentTool: string = 'none';
	shapeTool: any;
	selectedObjects: any[] = [];
	imageURL?: string;

	// Color presets from Directus, most are fetched from CSS variables

	presets = [
		{
			name: 'Purple',
			color: getStyleVar('--purple'),
			lowContrast: !tinycolor.isReadable(getStyleVar('--purple'), getStyleVar('--theme--form--field--input--background')),
		},
		{
			name: 'Blue',
			color: getStyleVar('--blue'),
			lowContrast: !tinycolor.isReadable(getStyleVar('--blue'), getStyleVar('--theme--form--field--input--background')),
		},
		{
			name: 'Green',
			color: getStyleVar('--green'),
			lowContrast: !tinycolor.isReadable(getStyleVar('--green'), getStyleVar('--theme--form--field--input--background')),
		},
		{
			name: 'Yellow',
			color: getStyleVar('--yellow'),
			lowContrast: !tinycolor.isReadable(getStyleVar('--yellow'), getStyleVar('--theme--form--field--input--background')),
		},
		{
			name: 'Orange',
			color: getStyleVar('--orange'),
			lowContrast: !tinycolor.isReadable(getStyleVar('--orange'), getStyleVar('--theme--form--field--input--background')),
		},
		{
			name: 'Red',
			color: getStyleVar('--red'),
			lowContrast: !tinycolor.isReadable(getStyleVar('--red'), getStyleVar('--theme--form--field--input--background')),
		},
		{
			name: 'Black',
			color: getStyleVar('--black'),
			lowContrast: !tinycolor.isReadable(getStyleVar('--black'), getStyleVar('--theme--form--field--input--background')),
		},
		{
			name: 'Gray',
			color: '#A2B5CD',
			lowContrast: !tinycolor.isReadable('#A2B5CD', getStyleVar('--theme--form--field--input--background')),
		},
		{
			name: 'White',
			color: getStyleVar('--white'),
			lowContrast: !tinycolor.isReadable(getStyleVar('--white'), getStyleVar('--theme--form--field--input--background')),
		},
	];

	private refreshViewport: Function;
	public loadFromJSON: Function;
	public triggerSave: Function;

	// Properties with dynamic getters and setters

	private _color: string = '';
	private _strokeType: string = 'none';
	private _strokeWidth: number = 1;
	private _fontSize: number = 16;
	private _textAlign: string = 'center';

	public get fontSize() {
		return this._fontSize;
	}

	public set fontSize(size: number) {
		this._fontSize = size;
		if (!this.canvas)
			return;

		this.canvas.getActiveObjects().forEach((o: any) => {
			if (o.type === 'textbox') {
				o.set('fontSize', size);
			}
		});

		this.triggerSave();
		this.canvas.requestRenderAll();
	}

	public get textAlign() {
		return this._textAlign;
	}

	public set textAlign(align: string) {
		this._textAlign = align;
		if (!this.canvas)
			return;

		this.canvas.getActiveObjects().forEach((o: any) => {
			if (o.type === 'textbox') {
				o.set('textAlign', align);
			}
		});

		this.triggerSave();
		this.canvas.requestRenderAll();
	}

	public get color() {
		return this._color;
	}

	public set color(color: string) {
		this._color = color;
		if (!this.canvas)
			return;

		if (this.canvas?.freeDrawingBrush) {
			this.canvas.freeDrawingBrush.color = color;
		}

		this.canvas.getActiveObjects().forEach((o: any) => {
			if (['path', 'arrow', 'line'].includes(o.type)) {
				o.set('stroke', color);
			}
			else {
				if (['rect', 'ellipse'].includes(o.type)) {
					o.set('stroke', tinycolor(color).darken(20).toString());
				}

				o.set('fill', color);
			}
		});

		this.triggerSave();
		this.canvas.requestRenderAll();
	}

	public get strokeType() {
		return this._strokeType;
	}

	public set strokeType(type: string) {
		this._strokeType = type;
		const objects = this.canvas.getActiveObjects();

		objects.forEach((o: any) => {
			if (['rect', 'ellipse'].includes(o.type)) {
				o.set(this.strokeConfig(type, o.fill));
			}
		});

		this.triggerSave();
		this.canvas.requestRenderAll();
	}

	public get strokeWidth() {
		return this._strokeWidth;
	}

	public set strokeWidth(width: number) {
		this._strokeWidth = width;

		if (this.canvas?.freeDrawingBrush) {
			this.canvas.freeDrawingBrush.width = width;
		}

		const objects = this.canvas.getActiveObjects();

		objects.forEach((o: any) => {
			if (['path', 'arrow', 'line'].includes(o.type)) {
				o.set('strokeWidth', width);
			}
		});

		this.triggerSave();
		this.canvas.requestRenderAll();
	}

	constructor() {
		this.color = this.presets[0]!.color;
		// Setup loadWithJSON function, with debounced locking mechanism to avoid saving to quickly after a load
		let ignoreSave = false;

		const resetIgnore = debounce(() => {
			ignoreSave = false;
		}, 500);

		this.loadFromJSON = (json: any) => {
			ignoreSave = true;
			this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas));
			resetIgnore();
		};

		// Avoid triggering the save event too quickly to allow objects to properly load first
		this.triggerSave = debounce(() => {
			if (ignoreSave) {
				this.triggerSave();
			}
			else {
				this.canvas.fire('edit:save');
			}
		}, 100);

		// Resize the viewport if the canvas size changes
		this.refreshViewport = debounce(() => {
			this.canvas?.setViewportTransform(this.canvas?.viewportTransform);
		}, 100);
	}

	/**
	 * Initialize the canvas when it has been mounted in the DOM
	 */
	public mount(canvasElement: HTMLCanvasElement) {
		const borderColor = getStyleVar('--theme--form--field--input--border-color-focus');
		const backgroundColor = getStyleVar('--theme--form--field--input--background');

		fabric.Object.prototype.transparentCorners = false;
		fabric.Object.prototype.borderColor = borderColor;
		fabric.Object.prototype.cornerColor = backgroundColor;
		fabric.Object.prototype.cornerSize = 9;
		fabric.Object.prototype.cornerStrokeColor = borderColor;

		this.canvas = markRaw(new fabric.Canvas(canvasElement));

		this.canvas.selectionBorderColor = borderColor;
		this.canvas.selectionColor = tinycolor(borderColor).setAlpha(0.25).toString();

		this.canvas.on('mouse:wheel', (o: any) => this.pan.call(this, o));
		this.canvas.on('mouse:down', (o: any) => this.mouseDown.call(this, o));
		this.canvas.on('mouse:up', () => this.mouseUp.call(this));
		this.canvas.on('mouse:move', (o: any) => this.mouseMove.call(this, o));

		this.canvas.on('selection:created', () => this.updateSelection.call(this));
		this.canvas.on('selection:cleared', () => this.updateSelection.call(this));
		this.canvas.on('selection:updated', () => this.updateSelection.call(this));

		this.canvas.on('object:scaling', (e: any) => {
			const object = e.target;

			if (object.type === 'rect') {
				object.set({
					rx: 6 * (1 / object.scaleX),
					ry: 6 * (1 / object.scaleY),
				});
			}
		});

		this.canvas.on('object:modified', () => this.triggerSave());
		this.canvas.on('object:added', () => this.triggerSave());
		this.canvas.on('object:removed', () => this.triggerSave());
		this.canvas.on('path:created', () => this.triggerSave());
	}

	private updateSelection() {
		const objects = this.canvas.getActiveObjects();

		if (objects.length === 1) {
			this.selectedShapeType = objects[0].type;

			if (objects[0].type === 'image') {
				// Do nothing
			}
			else if (['path', 'line', 'arrow'].includes(objects[0].type)) {
				this._color = objects[0].stroke;
			}
			else if (objects[0].fill) {
				this._color = objects[0].fill;
			}

			if (['rect', 'ellipse'].includes(objects[0].type)) {
				if (objects[0].strokeDashArray) {
					this._strokeType = 'dashed';
				}
				else if (objects[0].strokeWidth > 0) {
					this._strokeType = 'solid';
				}
				else {
					this.strokeType = 'none';
				}
			}
		}
		else {
			this.selectedShapeType = 'none';
		}
	}

	private createPencilBrush() {
		const brush = new fabric.PencilBrush(this.canvas);
		brush.decimate = 2.5;
		brush.width = this.strokeWidth;
		brush.color = this.color;
		return brush;
	};

	private createEraser() {
		const brush = new fabric.EraserBrush(this.canvas);
		brush.width = 10;
		return brush;
	};

	public deleteSelected() {
		const objects = this.canvas.getActiveObjects();
		const isEditingText = objects.find((o: any) => o.type === 'textbox' && o.isEditing);

		if (!isEditingText) {
			objects.forEach((o: any) => {
				this.canvas.remove(o);
			});

			this.canvas.discardActiveObject().renderAll();
		}
	}

	private setSelectable(bool: boolean) {
		this.canvas.selection = bool;

		this.canvas.forEachObject((o: any) => {
			o.selectable = bool;
		});
	}

	public setTool(tool: string) {
		this.setSelectable(true);
		this.canvas.isDrawingMode = false;
		this.selectedShapeType = 'none';
		this.shapeTool = null;
		this.currentTool = tool;

		switch (tool) {
			case 'pencil':
				this.canvas.freeDrawingBrush = this.createPencilBrush();
				this.canvas.isDrawingMode = true;
				break;
			case 'eraser':
				this.canvas.freeDrawingBrush = this.createEraser();
				this.canvas.isDrawingMode = true;
				break;
			case 'rect':
				this.setSelectable(false);
				this.shapeTool = fabric.Rect;
				break;
			case 'ellipse':
				this.setSelectable(false);
				this.shapeTool = fabric.Ellipse;
				break;
			case 'line':
				this.setSelectable(false);
				this.shapeTool = fabric.Line;
				break;
			case 'arrow':
				this.setSelectable(false);
				this.shapeTool = fabric.Arrow;
				break;
			case 'textbox':
				this.setSelectable(false);
				this.shapeTool = fabric.Textbox;
				break;
			default:
				break;
		}
	}

	public insertImage(url: string) {
		fabric.Image.fromURL(url, (oImg) => {
			oImg.scaleToHeight(this.canvas.height / 2);
			this.canvas.add(oImg);
			oImg.set('erasable', false);
			oImg.center();
			oImg.setCoords();
			this.canvas.renderAll();
		});
	}

	private strokeConfig(type: string, color: string) {
		return {
			stroke: tinycolor(color).darken(20).toString(),
			strokeWidth: type === 'none' ? 0 : 4,
			strokeUniform: true,
			strokeDashArray: type === 'dashed' ? [16, 10] : null,
			strokeLineCap: 'round',
		};
	}

	public setStrokeWidth(width: number) {
		this.strokeWidth = width;

		if (this.canvas.freeDrawingBrush) {
			this.canvas.freeDrawingBrush.width = width;
		}
	}

	public setSize(width: number, height: number) {
		if (this.canvas) {
			this.canvas.setWidth(width);
			this.canvas.setHeight(height);
		}

		this.canvas.requestRenderAll();
	}

	start: any;
	shape: any;

	private pan(o: any) {
		o.e.preventDefault();

		if (o.e.metaKey) {
			const delta = o.e.deltaY;
			let zoom = this.canvas.getZoom();
			zoom *= 0.999 ** delta;
			if (zoom > 20)
				zoom = 20;
			if (zoom < 0.01)
				zoom = 0.01;
			this.canvas.zoomToPoint({ x: o.e.offsetX, y: o.e.offsetY }, zoom);
		}
		else {
			const viewport = this.canvas.viewportTransform;
			viewport[4] -= o.e.deltaX;
			viewport[5] -= o.e.deltaY;
		}

		this.refreshViewport();
		this.canvas.requestRenderAll();
	}

	private mouseDown(o: any) {
		if (!this.shapeTool)
			return;
		this.start = this.canvas.getPointer(o.e);

		let config: any = {
			left: this.start.x,
			top: this.start.y,
			originX: 'left',
			originY: 'top',
			width: 0,
			height: 0,
			angle: 0,
			fill: this.color,
			erasable: false,
		};

		if (this.currentTool === 'textbox') {
			config.fontFamily = getStyleVar('--theme--fonts--sans--font-family');
			config.fontSize = this._fontSize;
			config.textAlign = this._textAlign;
			this.shape = new this.shapeTool('', config);
			this.canvas.setActiveObject(this.shape);
			this.canvas.add(this.shape);
		}
		else if (this.currentTool === 'line' || this.currentTool === 'arrow') {
			config.stroke = this.color;
			config.strokeWidth = this.strokeWidth;
			this.shape = new this.shapeTool([this.start.x, this.start.y, this.start.x, this.start.y], config);
			this.canvas.add(this.shape);
		}
		else {
			if (this.currentTool === 'rect' || this.currentTool === 'ellipse') {
				config = Object.assign(config, this.strokeConfig(this.strokeType, config.fill));
			}

			if (this.currentTool === 'rect') {
				config.rx = 6;
				config.ry = 6;
			}

			this.shape = new this.shapeTool(config);
			this.canvas.add(this.shape);
		}
	}

	private mouseUp() {
		if (!this.shapeTool || !this.shape)
			return;
		this.start = null;
		this.setTool('none');
		this.canvas.setActiveObject(this.shape);
		this.shape = null;
		this.canvas.renderAll();
	}

	private mouseMove(o: any) {
		if (!this.shapeTool || !this.shape)
			return;
		const pointer = this.canvas.getPointer(o.e);

		if (this.start.x > pointer.x) {
			this.shape.set({ left: Math.abs(pointer.x) });
		}

		if (this.start.y > pointer.y) {
			this.shape.set({ top: Math.abs(pointer.y) });
		}

		if (this.currentTool === 'line' || this.currentTool === 'arrow') {
			this.shape.set({ x2: pointer.x });
			this.shape.set({ y2: pointer.y });
		}
		else if (this.currentTool === 'ellipse') {
			this.shape.set({ rx: Math.abs(this.start.x - pointer.x) / 2 });
			this.shape.set({ ry: Math.abs(this.start.y - pointer.y) / 2 });
		}
		else {
			this.shape.set({ width: Math.abs(this.start.x - pointer.x) });

			if (this.currentTool !== 'textbox') {
				this.shape.set({ height: Math.abs(this.start.y - pointer.y) });
			}
		}

		this.canvas.renderAll();
	}
}
