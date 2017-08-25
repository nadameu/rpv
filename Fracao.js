/* exported Fracao */
const Fracao = (() => {

	// Usar somente números positivos
	const mdc = (a, b) => {
		if (b === 0) return a;
		return mdc(b, a % b);
	};

	const decimalParaFracao = (x, err = 1e-6) => {
		const sign = x < 0 ? -1 : 1;
		const whole = Math.floor(sign * x);
		const decimal = sign * x - whole;
		let lower_n = 0, lower_d = 1;
		let upper_n = 1, upper_d = 1;
		let num, den;
		let i;
		for (i = 0; i < 1e24; i++) {
			num = lower_n + upper_n;
			den = lower_d + upper_d;
			if (den * (decimal + err) < num) {
				[upper_n, upper_d] = [num, den];
			} else if (num < (decimal - err) * den) {
				[lower_n, lower_d] = [num, den];
			} else {
				num = sign * (whole * den + num);
				return Fracao(num, den, true);
			}
		}
		console.log('Gave up after %d iterations. The number was %f.', i, x);
		return Fracao(sign * (whole * den + num), den);
	};

	const Fracao = (n, d = 1) => {
		if (isNaN(n) || isNaN(d)) {
			console.error('Not a number:', n, d);
			throw new Error('NaN');
		}
		if (Math.floor(n) !== n || Math.floor(d) !== d) return decimalParaFracao(n / d);
		const sign = n * d < 0 ? -1 : 1;
		const _num = Math.abs(n);
		const _den = Math.abs(d);
		const divisor = mdc(_num, _den);
		return Object.assign(Object.create(Fracao.prototype), {
			_n: sign * _num / divisor,
			_d: _den / divisor
		});
	};
	Fracao.prototype = {
		constructor: Fracao,
		bimap(f, g) {
			return Fracao(f(this._n), g(this._d));
		},
		chain(f) {
			return f(this.valueOf());
		},
		equals(that) {
			return this._n === that._n && this._d === that._d;
		},
		extend(f) {
			return Fracao.of(f(this));
		},
		extract() {
			return this.valueOf();
		},
		lte(that) {
			if (this._d === that._d) return this._n <= that._n;
			return this.valueOf() <= that.valueOf();
		},
		map(f) { // derived
			return this.chain(x => Fracao.of(f(x)));
		},
		toCurrencyString() {
			return this.valueOf().toLocaleString('pt-BR', {
				minimumIntegerDigits: 1,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
		},
		toIntegerString() {
			return this.valueOf().toLocaleString('pt-BR', {
				minimumIntegerDigits: 1,
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			});
		},
		toPercentString() {
			return this.valueOf().toLocaleString('pt-BR', {
				style: 'percent',
				minimumIntegerDigits: 1,
				minimumFractionDigits: 0,
				maximumFractionDigits: 2
			});
		},
		toString() {
			return `${this._n}/${this._d}`;
		},
		valueOf() {
			return this._n / this._d;
		}
	};
	Fracao.fromDecimalString = text => {
		const valueAsString = String(text).replace(/[.]/g, '');
		const [whole, decimal] = valueAsString.split(',');
		const num = parseInt(`${whole}${decimal}`, 10);
		const den = typeof decimal === 'undefined' ? 1 : parseInt('1' + '0'.repeat(decimal.length), 10);
		return Fracao(num, den);
	};
	Fracao.of = x => {
		if (Math.floor(x) === x) return Fracao(x, 1);
		return decimalParaFracao(x);
	};
	return Fracao;
})();
