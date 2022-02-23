import ShaderRenderer from './shader-renderer.js';

const calcRatio = (m1, m2) => Math.pow(10, -0.4*(m1 - m2));
const calcTot = (m1, m2) => -2.5*Math.log10(
	Math.pow(10, -0.4*m1) +
	Math.pow(10, -0.4*m2)
);

let f1 = 1000;
let f2 = 1000;
let ratio = 0;
let total = 0;

const update = () => {
	renderer.render();
};

const addRange = ({ label, min, max, step, init, onchange }) => {
	const div = document.createElement('div');
	div.innerHTML += `<div class="label">${label}: </div>`;
	const input = document.createElement('input');
	input.setAttribute('type', 'range');
	input.setAttribute('min', min);
	input.setAttribute('max', max);
	input.setAttribute('step', step);
	div.appendChild(input);
	document.body.appendChild(div);
	const view = document.createElement('span');
	div.appendChild(view);
	input.addEventListener('input', () => {
		onchange(input.value*1);
		view.innerText = (input.value*1).toFixed(3)*1;
	});
	input.value = init;
};

const toAlpha = x => Math.round(Math.min(255, Math.max(0, x)));
const shader = (ax, ay, bx, by) => {
	const cx = (ax + bx)/2;
	const cy = (ay + by)/2;
	const e1 = calcRatio(cx, cy) - ratio;
	const e2 = calcTot(cx, cy) - total;
	return `rgb(${
		toAlpha(Math.sqrt(f1/(e1*e1)/100))
	}, ${
		toAlpha(Math.sqrt(f2/(e2*e2)/100))
	}, 255)`;
};

const renderer = new ShaderRenderer({
	canvas: document.querySelector('canvas'),
	shader,
	minInterval: 100,
	box: [0, 0, 25, 25],
});

addRange({
	label: 'Ratio brightness',
	min: 0,
	max: 20,
	step: 0.01,
	init: Math.log(f1),
	onchange: val => {
		f1 = Math.exp(val) - 1;
		update();
	},
});
addRange({
	label: 'Tot brightness',
	min: 0,
	max: 20,
	step: 0.01,
	init: Math.log(f2),
	onchange: val => {
		f2 = Math.exp(val) - 1;
		update();
	},
});

renderer.canvas.addEventListener('mousemove', e => {
	const x = e.offsetX;
	const y = e.offsetY;
	const val = renderer.pxToVal(x, y).map(v => v.toFixed(1)*1).join(' ');
	document.querySelector('#coord').innerText = val;
});

const loadInput = (name, onchange) => {
	const input = document.querySelector(`[placeholder="${name}"]`);
	input.addEventListener('input', () => {
		onchange(input.value);
	});
};

loadInput('ratio', value => {
	ratio = Number(value);
	update();
});

loadInput('total', value => {
	total = Number(value);
	update();
});
