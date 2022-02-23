import ShaderRenderer from './shader-renderer.js';

const max = 25;
const nSlices = 8;
const iterations = 60;
const shrinkFactor = 0.75;

const calcRatio = (m1, m2) => Math.pow(10, -0.4*(m1 - m2));
const calcTotal = (m1, m2) => -2.5*Math.log10(
	+ Math.pow(10, -0.4*m1)
	+ Math.pow(10, -0.4*m2)
);

const solveFor = (ratio, total) => {
	const mid = max/2;
	let range = max;
	const calcRatioError = (m1, m2) => {
		const dif = ratio - calcRatio(m1, m2);
		return dif*dif;
	};
	const calcTotalError = (m1, m2) => {
		const dif = total - calcTotal(m1, m2);
		return dif*dif;
	};
	const calcBothErrors = (m1, m2) => {
		return calcRatioError(m1, m2) + calcTotalError(m1, m2);
	};
	const minimize = (target, calcError) => {
		const [ m1, m2 ] = target;
		const a = range/nSlices;
		const b = a/2 - range/2;
		let error = calcError(m1, m2);
		for (let i1=0; i1<nSlices; ++i1) {
			const t1 = m1 + i1*a + b;
			for (let i2=0; i2<nSlices; ++i2) {
				const t2 = m2 + i2*a + b;
				const e = calcError(t1, t2);
				if (e < error) {
					target[0] = t1;
					target[1] = t2;
					error = e;
				}
			}
		}
	};
	const target = [ mid, mid ];
	for (let i=0; i<iterations; ++i) {
		minimize(target, calcBothErrors);
		range *= shrinkFactor;
	}
	return target;
};

const loadInput = (name, onchange) => {
	const input = document.querySelector(`[placeholder="${name}"]`);
	input.addEventListener('input', () => {
		onchange(input.value);
	});
};

let ratio, total;
const update = () => {
	const res = solveFor(ratio, total);
	const [ m1, m2 ] = res.map(v => v.toFixed(6)*1);
	const text = `m1 = ${m1}, m2 = ${m2}`;
	document.querySelector('#result').innerText = text;
};

loadInput('ratio', value => {
	ratio = Number(value);
	if (total != null) update();
});

loadInput('total', value => {
	total = Number(value);
	if (ratio != null) update();
});
