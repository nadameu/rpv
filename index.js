/* global Fracao */

const Soma = (() => {
	const Soma = fracao => Object.assign(
		Object.create(Soma.prototype),
		{ fracao }
	);
	Soma.prototype = {
		constructor: Soma,
		concat(that) {
			return Soma(Fracao(this.fracao._n * that.fracao._d + that.fracao._n * this.fracao._d, this.fracao._d * that.fracao._d));
		}
	};
	Soma.empty = () => Soma(Fracao.of(0));
	Soma.of = (...fracoes) => fracoes.reduce(
		(anterior, fracao) => anterior.concat(Soma(fracao)),
		Soma.empty()
	);
	return Soma;
})();

const Mult = (() => {
	const Mult = fracao => Object.assign(
		Object.create(Mult.prototype),
		{ fracao }
	);
	Mult.prototype = {
		constructor: Mult,
		concat(that) {
			return Mult(Fracao(this.fracao._n * that.fracao._n, this.fracao._d * that.fracao._d));
		}
	};
	Mult.empty = () => Mult(Fracao.of(1));
	Mult.of = (...fracoes) => fracoes.reduce(
		(anterior, fracao) => anterior.concat(Mult(fracao)),
		Mult.empty()
	);
	return Mult;
})();

const curry = (fn, ...args) => {
	if (args.length >= fn.length) return fn(...args);
	return (...moreArgs) => curry(fn, ...args, ...moreArgs);
};

const ap = curry((afx, ax) => {
	if ('ap' in ax) return ax.ap(afx);
	if (ax instanceof Promise) return Promise.all([afx, ax]).then(([f, x]) => f(x));
});
const foldMap = curry((f, i, foldable) => foldable.reduce((acc, x) => acc.concat(f(x)), i));
const inserirApos = (novo, antigo) => antigo.parentElement.insertBefore(novo, antigo.nextSibling);
const liftA = (fn, a, ...as) => as.reduce(ap, map(fn, a));
const liftM = (fn, ...ms) => {
	let acc = fn;
	for (let m of ms) {
		m.map(value => { acc = acc(value); return value; });
	}
	return ms[0].map(() => acc);
};
const map = curry((fn, obj) => {
	if ('map' in obj) return obj.map(fn);
	if (obj instanceof Promise) return obj.then(fn);
});

const divididoPor = curry((a, b) => vezes(a, inv(b)));
const inv = fracao => Fracao(fracao._d, fracao._n);
const mais = curry((a, b) => soma(a, b));
const menos = curry((a, b) => mais(a, vezes(b, Fracao(-1, 1))));
const vezes = curry((a, b) => mult(a, b));
const mult = (...fracoes) => foldMap(Mult, Mult.empty(), fracoes).fracao;
const soma = (...fracoes) => foldMap(Soma, Soma.empty(), fracoes).fracao;

const main = () => {
	const url = new URL(window.location.href);
	switch (url.searchParams.get('acao')) {

		case 'oficio_requisitorio_requisicoes_cadastrar': {
			const fieldset = obterFieldset();
			const formulario = fieldset.then(inserirFormularioPreCalculoOculto);
			liftA(fieldset => formulario => inserirBotaoPrecalcular(fieldset, formulario), fieldset, formulario);
			return;
		}

		case 'oficio_requisitorio_requisicoes_editar': {
			const fieldset = obterFieldset();
			const formulario = fieldset.then(inserirFormularioPreCalculoOculto);
			liftA(fieldset => formulario => inserirBotaoPrecalcular(fieldset, formulario), fieldset, formulario);
			return;
		}

		case 'oficio_requisitorio_beneficiarioshonorarios_editar': {
			const anoCorrente = document.getElementById('txtAnoExCorrente');
			anoCorrente.disabled = false;
			return;
		}

		default: {
			console.error('Página desconhecida.');
		}
	}
};

const obterFieldset = () => Promise.resolve().then(() => {
	const fieldset = document.getElementById('fldDadosReq');
	return fieldset == null ? Promise.reject('Fieldset não encontrado.') : Promise.resolve(fieldset);
});

const inserirBotaoPrecalcular = (fieldset, formulario) => {
	const botao = Object.assign(
		document.createElement('button'),
		{
			className: 'infraButton',
			textContent: 'Pré-calcular'
		}
	);
	botao.addEventListener('click', evt => {
		evt.preventDefault();
		evt.stopPropagation();
		formulario.style.display = '';
		botao.style.display = 'none';
	});
	inserirApos(botao, fieldset);
};

const inserirFormularioPreCalculoOculto = fieldset => {
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = [
		`<fieldset style="display: none;" class="infraFieldset gm-precalculo">`,
		`<legend class="infraLegendObrigatorio gm-precalculo__legend">Pré-cálculo</legend>`,

		`<label for="gmQtdBeneficiarios" class="infraLabelObrigatorio gm-precalculo__label gm-precalculo__qtd-beneficiarios-label">Quantidade de beneficiários:</label>`,
		`<input id="gmQtdBeneficiarios" class="gm-precalculo__campo gm-precalculo__campo_inteiro gm-precalculo__campo_obrigatorio gm-precalculo__qtd-beneficiarios" type="text" placeholder="1">`,

		`<label for="gmPrincipal" class="infraLabelObrigatorio gm-precalculo__label gm-precalculo__principal-label">Valor principal (SEM JUROS)</label>`,
		`<input id="gmPrincipal" class="gm-precalculo__campo gm-precalculo__campo_moeda gm-precalculo__campo_obrigatorio gm-precalculo__principal" type="text" placeholder="0,00">`,

		`<label for="gmJuros" class="infraLabelOpcional gm-precalculo__label gm-precalculo__juros-label">Juros</label>`,
		`<input id="gmJuros" class="gm-precalculo__campo gm-precalculo__campo_moeda gm-precalculo__campo_calculado gm-precalculo__juros" type="text" placeholder="0,00" disabled="disabled">`,

		`<label for="gmTotal" class="infraLabelObrigatorio gm-precalculo__label gm-precalculo__total-label">Valor total (COM JUROS)</label>`,
		`<input id="gmTotal" class="gm-precalculo__campo gm-precalculo__campo_moeda gm-precalculo__campo_obrigatorio gm-precalculo__total" type="text" placeholder="0,00">`,

		`<label for="gmMesesAnterior" class="infraLabelOpcional gm-precalculo__label gm-precalculo__meses-anterior-label">Meses anos anteriores</label>`,
		`<input id="gmMesesAnterior" class="gm-precalculo__campo gm-precalculo__campo_inteiro gm-precalculo__campo_opcional gm-precalculo__meses-anterior" type="text" placeholder="0">`,

		`<label for="gmMesesCorrente" class="infraLabelOpcional gm-precalculo__label gm-precalculo__meses-corrente-label">Meses ano corrente</label>`,
		`<input id="gmMesesCorrente" class="gm-precalculo__campo gm-precalculo__campo_inteiro gm-precalculo__campo_opcional gm-precalculo__meses-corrente" type="text" placeholder="0">`,

		`<fieldset class="infraFieldset gm-precalculo__beneficiarios">`,
		`<legend class="infraLegendObrigatorio gm-precalculo__beneficiarios-legend">Proporção de cada beneficiário</legend>`,
		`</fieldset>`,

		`<output class="gm-precalculo__erros"></output>`,

		`<div class="gm-precalculo__resultado"></div>`,

		`</fieldset>`
	].join('');
	const formulario = tempDiv.firstChild;
	const principal = tempDiv.querySelector('.gm-precalculo__principal');
	const juros = tempDiv.querySelector('.gm-precalculo__juros');
	const total = tempDiv.querySelector('.gm-precalculo__total');
	const elementoQtdBeneficiarios = tempDiv.querySelector('.gm-precalculo__qtd-beneficiarios');
	const mesesAnterior = tempDiv.querySelector('.gm-precalculo__meses-anterior');
	const mesesCorrente = tempDiv.querySelector('.gm-precalculo__meses-corrente');
	const beneficiarios = tempDiv.querySelector('.gm-precalculo__beneficiarios');
	const erros = tempDiv.querySelector('.gm-precalculo__erros');

	Array.from(tempDiv.querySelectorAll('.gm-precalculo__campo_inteiro')).forEach(elemento => elemento.addEventListener('input', () => {
		const texto = elemento.value.replace(/\D/g, '');
		if (texto === '') {
			elemento.value = '';
		} else {
			const valor = Fracao.fromDecimalString(texto);
			elemento.value = valor.toIntegerString();
		}
		validarCampos();
	}));

	Array.from(tempDiv.querySelectorAll('.gm-precalculo__campo_moeda')).forEach(elemento => elemento.addEventListener('input', () => {
		const texto = elemento.value.replace(/\D/g, '');
		const valor = Fracao.fromDecimalString(texto).map(x => x / 100);
		if (valor.valueOf() === 0) {
			elemento.value = '';
		} else {
			elemento.value = valor.toCurrencyString();
		}
		validarCampos();
	}));

	const atualizarBeneficiarios = () => {
		const qtdBeneficiarios = Fracao.fromDecimalString(elementoQtdBeneficiarios.value || elementoQtdBeneficiarios.placeholder);
		const camposBeneficiario = Array.from(document.querySelectorAll('.gm-precalculo__campo_beneficiario'));
		const qtdBeneficiariosAtual = camposBeneficiario.length;
		camposBeneficiario.slice(qtdBeneficiarios.valueOf()).forEach(campo => {
			campo.removeEventListener('change', validarCampos);
			campo.parentElement.removeChild(campo);
		});
		for (let i = qtdBeneficiariosAtual; i < qtdBeneficiarios.valueOf(); i++) {
			beneficiarios.insertAdjacentHTML('beforeend', [
				`<div class="gm-precalculo__campo_beneficiario">`,
				`<label for="gmBeneficiario${i}" class="infraLabelObrigatorio gm-precalculo__label gm-precalculo__beneficiario-${i}-label">Beneficiário ${i + 1}:</label> `,
				`<select id="gmBeneficiario${i}" class="gm-precalculo__beneficiario-${i} gm-precalculo__beneficiario gm-precalculo__campo gm-precalculo__campo_obrigatorio"></select>`,
				`</div>`,
			].join(''));
			const beneficiario = document.querySelector(`.gm-precalculo__beneficiario-${i}`);
			beneficiario.addEventListener('change', validarCampos);
		}
		const opcoes = [{
			fracao: Fracao(1, 1),
			value: '1/1',
			textContent: 'Valor integral (100%)'
		}];
		for (let i = 1; i < qtdBeneficiarios.valueOf(); i++) {
			const fracao = Fracao(i, qtdBeneficiarios.valueOf());
			const value = fracao.toString();
			const textContent = `${value} (${fracao.toPercentString()})`;
			opcoes.push({ fracao, value, textContent });
		}
		opcoes.sort((a, b) => a.fracao.valueOf() - b.fracao.valueOf());
		for (let i = 0; i < qtdBeneficiarios; i++) {
			const beneficiario = document.querySelector(`.gm-precalculo__beneficiario-${i}`);
			beneficiario.innerHTML = opcoes.map(({ value, textContent }) => `<option value="${value}">${textContent}</option>`).join('');
			beneficiario.value = `1/${qtdBeneficiarios.valueOf()}`;
		}
		validarCampos();
	};
	elementoQtdBeneficiarios.addEventListener('input', atualizarBeneficiarios);

	const validarCampos = () => {
		const mensagens = [];
		const valorPrincipal = Fracao.fromDecimalString(principal.value || total.value || '0');
		if (principal.value === '') {
			principal.placeholder = valorPrincipal.toCurrencyString();
		}
		const valorTotal = Fracao.fromDecimalString(total.value || principal.value || '0');
		if (total.value === '') {
			total.placeholder = valorTotal.toCurrencyString();
		}
		const valorJuros = menos(valorTotal, valorPrincipal);
		valorJuros.chain(j => {
			if (j < 0) {
				juros.value = 'ERRO';
				juros.classList.add('gm-precalculo__campo_invalido');
				mensagens.push('Valor total não pode ser menor que principal.');
			} else {
				juros.classList.remove('gm-precalculo__campo_invalido');
				juros.value = valorJuros.toCurrencyString();
			}
		});
		const qtdMesesAnterior = Fracao.fromDecimalString(mesesAnterior.value || mesesAnterior.placeholder);
		const qtdMesesCorrente = Fracao.fromDecimalString(mesesCorrente.value || mesesCorrente.placeholder);
		qtdMesesCorrente.chain(meses => {
			if (meses > 13) {
				mesesCorrente.classList.add('gm-precalculo__campo_invalido');
				mensagens.push(`Ano corrente não pode ter ${meses} meses.`);
			} else {
				mesesCorrente.classList.remove('gm-precalculo__campo_invalido');
			}
		});

		const qtdBeneficiarios = Fracao.fromDecimalString(elementoQtdBeneficiarios.value || elementoQtdBeneficiarios.placeholder);
		qtdBeneficiarios.chain(qtd => {
			if (qtd < 1) {
				elementoQtdBeneficiarios.classList.add('gm-precalculo__campo_invalido');
				mensagens.push('É preciso ao menos um beneficiário.');
			} else {
				elementoQtdBeneficiarios.classList.remove('gm-precalculo__campo_invalido');

				const camposBeneficiario = Array.from(document.querySelectorAll('.gm-precalculo__beneficiario'));
				const somaFracoes = soma(...camposBeneficiario.map(beneficiario => {
					const [num, den] = beneficiario.value.split('/').map(Number);
					return Fracao(num, den);
				}));
				if (+somaFracoes !== 1) {
					camposBeneficiario.forEach(campo => {
						campo.classList.add('gm-precalculo__campo_invalido');
					});
					mensagens.push('Soma da porcentagem dos beneficiários deve atingir 100%. Atual: ' + somaFracoes.toPercentString());
				} else {
					camposBeneficiario.forEach(campo => {
						campo.classList.remove('gm-precalculo__campo_invalido');
					});
				}
			}
		});

		erros.innerHTML = mensagens.join('<br>');
	};
	inserirApos(formulario, fieldset);
	atualizarBeneficiarios();
	validarCampos();
	return formulario;
};

main();

/*
const criarBotao = (divHonContrat, selHonDestac, txtNumPercHonorario) => {
	divHonContrat.style.height = '55px';
	selHonDestac.insertAdjacentHTML('afterend', `
<label for="gmPorcentagemHonorarios" class="infraLabelObrigatorio" style="position: absolute; top: 20px; left: 0; width: 10%;">Porcentagem:</label>
<input id="gmPorcentagemHonorarios" style="position: absolute; top: 35px; left: 0; width: 10%;" onkeypress="return infraMascaraDinheiro(this, event, 2, 5);">
<button id="gmCalcular" class="infraButton" style="position: absolute; top: 35px; left: 20%;">Calcular</button>
`);
	const input = document.getElementById('gmPorcentagemHonorarios');
	const button = document.getElementById('gmCalcular');

	input.addEventListener('keypress', () => {
		let pct = Moeda.fromString(input.value) / 100;
		txtNumPercHonorario.value = Moeda.toString(pct / (1 - pct) * 100);
	});
	['lblNumPercHonorario', 'txtNumPercHonorario', 'lblHintNumPercHonorario', 'btnAplicarCalc'].forEach(id => document.getElementById(id).style.display = 'initial');
	return { input, button };
};

const divHonContrat = document.getElementById('divHonContrat');
const selHonDestac = document.getElementById('selHonDestac');
const txtNumPercHonorario = document.getElementById('txtNumPercHonorario');
const { input, button } = criarBotao(divHonContrat, selHonDestac, txtNumPercHonorario);

const campos = ['Total', 'Principal', 'Juros', 'ExCorrente', 'ExAnterior'];
const createMapper = f => next => (acc, x) => next(acc, f(x));
const transducer = createMapper(nome => ({ [nome]: document.getElementById(`txtValor${nome}`) }));
const elementos = campos.reduce(transducer(Object.assign), {});
let valoresCarregados = false;
let valoresOriginais = [];

button.addEventListener('click', evt => {
	evt.preventDefault();
	evt.stopPropagation();
	const porcentagem = Moeda.fromString(input.value) / 100;
	if (! valoresCarregados) {
		const transducer = createMapper(nome => ({ [nome]: Moeda.fromString(elementos[nome].value) }));
		valoresOriginais = campos.reduce(transducer(Object.assign), {});
		valoresCarregados = true;
	}
	const camposPrincipais = ['Total', 'Principal', 'ExAnterior'];
	camposPrincipais.forEach(nome => {
		const valorOriginal = valoresOriginais[nome];
		const valorAdvogado = Math.round(valorOriginal * porcentagem * 100) / 100;
		const valorBeneficiario = Math.round((valorOriginal - valorAdvogado) * 100) / 100;
		elementos[nome].value = Moeda.toString(valorBeneficiario);
	});
	elementos.Juros.value = Moeda.toString(Moeda.fromString(elementos.Total.value) - Moeda.fromString(elementos.Principal.value));
	elementos.ExCorrente.value = Moeda.toString(Moeda.fromString(elementos.Total.value) - Moeda.fromString(elementos.ExAnterior.value));
});

const preencherAutomaticamenteBeneficiario = () => {
	const elementosImportantes = ['Total', 'Principal', 'Juros'].map(nome => elementos[nome]);
	const zerados = elementosImportantes.filter(x => x.value === '0,00');
	if (zerados.length !== 1) return;
	if (elementos.Total.value === '0,00') elementos.Total.value = Moeda.toString(Moeda.fromString(elementos.Principal.value) + Moeda.fromString(elementos.Juros.value));
	if (elementos.Principal.value === '0,00') elementos.Principal.value = Moeda.toString(Moeda.fromString(elementos.Total.value) - Moeda.fromString(elementos.Juros.value));
	if (elementos.Juros.value === '0,00') elementos.Juros.value = Moeda.toString(Moeda.fromString(elementos.Total.value) - Moeda.fromString(elementos.Principal.value));
};
['Total', 'Principal', 'Juros'].forEach(nome => elementos[nome].addEventListener('blur', preencherAutomaticamenteBeneficiario));

const preencherAutomaticamenteRRA = () => {
	const elementosImportantes = ['ExCorrente', 'ExAnterior'].map(nome => elementos[nome]);
	const zerados = elementosImportantes.filter(x => x.value === '0,00');
	if (zerados.length !== 1) return;
	if (elementos.ExCorrente.value === '0,00') elementos.ExCorrente.value = Moeda.toString(Moeda.fromString(elementos.Total.value) - Moeda.fromString(elementos.ExAnterior.value));
	if (elementos.ExAnterior.value === '0,00') elementos.ExAnterior.value = Moeda.toString(Moeda.fromString(elementos.Total.value) - Moeda.fromString(elementos.ExCorrente.value));
};
['ExCorrente', 'ExAnterior'].forEach(nome => elementos[nome].addEventListener('blur', preencherAutomaticamenteRRA));
*/