const LEFT_BUTTON_MASK = 1;

const defaultShader = (ax, ay, bx, by) => {
	const cx = (ax + bx)*0.5;
	const cy = (ay + by)*0.5;
	const red = Math.min(255, cx*255) | 0;
	const green = Math.min(255, cy*255) | 0;
	return `rgb(${red}, ${green}, 0)`;
};

const freeThread = () => new Promise(done => setTimeout(done, 0));

const bindCanvas = (canvas, renderer) => {
	let startClick = null;
	canvas.addEventListener('mousedown', e => {
		if (e.button !== 0) {
			return;
		}
		const { offsetX: ax, offsetY: ay } = e;
		const [ vax, vay ] = renderer.pxToVal(ax, ay);
		const { dx, dy } = renderer.zoom;
		startClick = { ax, ay, vax, vay, dx, dy };
	});
	canvas.addEventListener('mousemove', e => {
		if ((e.buttons&LEFT_BUTTON_MASK) === 0) {
			startClick = null;
		}
		if (startClick === null) {
			return;
		}
		const { offsetX: bx, offsetY: by } = e;
		const { ax, ay, vax, vay, dx, dy } = startClick;
		const [ vbx, vby ] = renderer.pxToVal(bx, by);
		renderer.zoom.dx = dx + bx - ax;
		renderer.zoom.dy = dy + by - ay;
		renderer.render();
	});
	canvas.addEventListener('wheel', e => {
		const { offsetX: x, offsetY: y } = e;
		const { zoom } = renderer;
		if (!e.deltaY) {
			return;
		}
		const factor = e.deltaY < 0 ? 1.5 : 1/1.5;
		const { scale, dx, dy } = zoom;
		const s = scale*factor;
		const ox = (x - dx)/scale;
		const oy = (y - dy)/scale;
		zoom.scale = s;
		zoom.dx = x - ox*s;
		zoom.dy = y - oy*s;
		renderer.render();
	});
};

class ShaderRenderer {
	constructor({ canvas, shader, minInterval = 10, box = [-0.5, -0.5, 2, 2] }) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.shader = shader;
		this.renderId = 0;
		this.minInterval = minInterval;
		this.box = box;
		this.zoom = { scale: 1, dx: 0, dy: 0 };
		bindCanvas(canvas, this);
		this.render();
	}
	async render() {
		const { canvas, ctx, shader, minInterval, box, zomo } = this;
		const { width, height } = canvas;
		const [ v0x, v0y, v1x, v1y ] = box;
		const id = ++ this.renderId;
		let nextFree = Date.now() + minInterval;
		const [ ax, ay ] = this.pxToVal(0, 0);
		const [ bx, by ] = this.pxToVal(width, height);
		const fx = (bx - ax)/width;
		const ox = ax;
		const fy = (by - ay)/height;
		const oy = ay;
		const maxSide = Math.max(width, height);
		let square = 1;
		while (square < maxSide) {
			square *= 2;
		}
		for (;square >= 1; square >>= 1) {
			for (let y0=0; y0<height; y0+=square) {
				const y1 = Math.min(height, y0 + square);
				const v0y = y0*fy + oy;
				const v1y = y1*fy + oy;
				for (let x0=0; x0<width; x0+=square) {
					const x1 = Math.min(width, x0 + square);
					const v0x = x0*fx + ox;
					const v1x = x1*fx + ox;
					if (Date.now() >= nextFree) {
						await freeThread();
						if (this.renderId !== id) {
							return;
						}
						nextFree = Date.now() + minInterval;
					}
					ctx.fillStyle = shader(v0x, v0y, v1x, v1y);
					ctx.fillRect(x0, y0, square, square);
				}
			}
		}
	}
	pxToVal(px, py) {
		const { canvas, zoom, box } = this;
		const { width, height } = canvas;
		const { scale, dx, dy } = zoom;
		const [ v0x, v0y, v1x, v1y ] = box;
		const x = (px - dx)/scale;
		const y = (py - dy)/scale;
		const nx = x/width;
		const ny = 1 - y/height;
		return [
			nx*(v1x - v0x) + v0x,
			ny*(v1y - v0y) + v0y,
		];
	}
	valToPx(valx, valy) {
		const { zoom, canvas, box } = this;
		const { width, height } = canvas;
		const { scale, dx, dy } = zoom;
		const [ v0x, v0y, v1x, v1y ] = box;
		const nx = (valx - v0x)/(v1x - v0x);
		const ny = (valy - v0y)/(v1y - v0y);
		const px = nx*width;
		const py = ny*height;
		return [
			px*scale + dx,
			py*scale + dy,
		];
	}
}

export default ShaderRenderer;
