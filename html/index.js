onload = () => {

	const SRC_FIRST = 0, SRC_LAST = 1, SRC_ALL = 2, SRC_FAMILY = 3;
	const CHART_TAG_LIST = 0, CHART_TAG_CLOUD = 1;

	const sort = (json, src, ago) => {
		let stats = [], names = []

		const to_stats = (name, item) => {
			if (-1 == names.indexOf(name))
			{
				names.push(name);
			}

			const index = names.indexOf(name)

			stats[index] = stats[index] ?? {name: name, items: []}
			stats[index].items.push(item)
		}

		const to_stats_family = (name, item) => {
			if (-1 !== name.indexOf('-'))
			{
				name.split('-').map((chunk) => {
					to_stats_family(chunk, item)
				})

				return;
			}

			const key = name
				.replace(/ова?$/, 'oви')
				.replace(/ева?$/, 'eви')
				.replace(/(ски|ска)$/, 'ски')

			to_stats(key, item)
		}

		json.map((item) => {
			let episode, first, last, year;
			[episode, first, last, year] = item;

			if (0 != ago)
			{
				const max_year = json[0][3], selected_year = max_year -ago
				if (year > selected_year)
				{
					return;
				}
			}

			switch (src)
			{
				case SRC_ALL:
					return to_stats(first, item) || to_stats(last, item);

				case SRC_FIRST:
					return to_stats(first, item);

				case SRC_LAST:
					return to_stats(last, item);

				case SRC_FAMILY:
					return to_stats_family(last, item);
			}
		})

		return stats.sort((a, b) => {
			return (a.items.length > b.items.length)
				? -1
				: (a.items.length < b.items.length
					? 1
					: 0);
		});
	}

	const root = document.getElementById('chart')

	let nav = {src: SRC_ALL, chart: CHART_TAG_LIST, year: 0}

	const reset_nav = (button, label) => {
		[...button.parentNode.parentNode.childNodes].map((el) => {
			el.firstChild.className = el.firstChild.className.replace('active', '')
		})

		button.className += ' active'
		button.parentNode.parentNode.parentNode.firstChild.innerHTML =
			label + ': <strong>' + button.innerHTML + '</strong>'
	}

	const click_nav = (json, index, target) => {
		nav[target] = index
		render_loading(() => render_chart(json, nav.src, nav.chart, nav.year));
	}

	const compose_nav = (label, current, options, target, json) => {
		const li = document.createElement('li')
		li.className = 'nav-item dropdown'

		const selected = document.createElement('a')
		selected.className = 'nav-link dropdown-toggle'
		selected.setAttribute('data-bs-toggle', 'dropdown')
		selected.setAttribute('role', 'button')
		selected.setAttribute('aria-expanded', 'false')
		li.appendChild(selected)

		const ul = document.createElement('ul')
		ul.className = 'dropdown-menu'
		li.appendChild(ul)

		let offset = 0;
		options.map((option, index) => {

			if ('' == option)
			{
				const li = document.createElement('li')
				li.innerHTML = '<hr class="dropdown-divider" />'

				++offset
				return ul.appendChild(li)
			}

			const key = index - offset
			const command = document.createElement('button')
			command.type = 'button'
			command.className = 'dropdown-item'
			command.innerHTML = option
			command.addEventListener('click', () =>
				reset_nav(command, label) || click_nav(json, key, target))

			ul.appendChild(document.createElement('li')).appendChild(command)

			if (key == current)
			{
				reset_nav(command, label)
			}
		})

		new bootstrap.Dropdown(selected)

		return li
	}

	const render_nav = (json) => {
		const max_year = json[0][3]
		const min_year = json[json.length-1][3]
		const years = [...Array(max_year -min_year).keys()].map(i => 'до ' + (i +min_year +1)).reverse()
		const year_options = ['Всички', ''].concat(years)

		const src_options = ['Лични имена', 'Фамилни имена', '', 'Всички имена', 'Фамилии']
		const chart_options = ['Списък', 'Облак']

		document.getElementById('control').replaceChildren(
			compose_nav('Имена', nav.src, src_options, 'src', json),
			compose_nav('Години', nav.year, year_options, 'year', json),
			compose_nav('Представяне', nav.chart, chart_options, 'chart', json)
		);

		return json
	}

	const render_chart = (json, src, chart, year) => {
		const stats = sort(json, src, year)
		switch (chart)
		{
			case CHART_TAG_LIST:
				return render_tag_list(stats)

			case CHART_TAG_CLOUD:
				return render_tag_cloud(stats)
		}
	};

	const render_loading = (callback) => {
		root.style.height = '200px'

		root.className = 'loading d-flex align-items-center justify-content-center'
		root.innerHTML = '<div class="spinner-border" role="status">'
			+ '<span class="visually-hidden">Зареждане...</span>'
			+ '</div>';

		setTimeout(callback, 400)
	};

	const compose_tag_list = (stats, options) => {

		const min_font = options.min_font || 13
		const max_font = options.max_font || 40

		const chart = document.createElement('div')

		chart.style.width = root.offsetWidth + 'px';
		chart.style.visibility = 'hidden'
		document.body.appendChild(chart)

		let min = Number.MAX_SAFE_INTEGER
		let max = -min
		let sum = 0

		stats.map((item) => {
			const total = item.items.length
			if (total > max)
			{
				max = total;
			}

			if (total < min)
			{
				min = total;
			}

			sum += total
		})

		const a = (max_font - min_font) / (max - min);
	        const b = min_font - (min * a);

		stats.map((item, i) => {
			const span = document.createElement('span')

			const size = Math.ceil(parseInt((a * item.items.length + b) * 10, 10) / 10);
			span.style.fontSize = size + 'px'

			span.className = 'stigmo-tag btn btn-info m-1'

			span.innerHTML = item.name
				+ '<span class="badge rounded-pill text-bg-dark ms-1">'
				+ item.items.length
				+ '</span>'

			chart.appendChild( span )
		})

		return chart;
	}

	const render_tag_list = (stats) => {
		const chart = compose_tag_list(stats, {min_font: 13, max_font: 40})

		render_resize(chart, '')
	}

	const render_tag_cloud = (stats) => {

		const chart = compose_tag_list(stats, {min_font: 13, max_font: 40})
		const tags = [...chart.getElementsByClassName('stigmo-tag')]

		let width = 0
	        const padding = 11;
	        let containerPadding = 0;
		const containerPaddingRate = 1.00145
		const containerWidth = chart.offsetWidth

		const table = document.createElement('table');
		let tr = document.createElement('tr')
		table.appendChild(tr)
		let td = document.createElement('td')
		tr.appendChild(td)
		td.setAttribute('align', 'center')
		// td.setAttribute('vertical-align', 'middle')

		tags.map((item) => {
			if (width + item.offsetWidth + padding >= containerWidth - containerPadding)
			{
				td = document.createElement('td')
				td.setAttribute('align', 'center')

				let nr = document.createElement('tr')
				nr.appendChild(td)

				if(1 || table.childNodes.length %2)
				{
					// td.setAttribute('vertical-align', 'bottom')
					table.appendChild(nr)
				} else {
					// td.setAttribute('vertical-align', 'top')
					table.insertBefore(nr, table.firstChild)
				}

				tr = nr;

				containerPadding = containerPadding * containerPaddingRate + padding
				width = 0
	                }

			width = width + item.offsetWidth + padding;

			td.childNodes.length %2
				? td.appendChild(item)
				: td.insertBefore(item, td.firstChild)
		})

		chart.appendChild(table);

		render_resize(chart, '')
	}

	const render_resize = (el, className) => {
		root.style.overflow = 'hidden';
		root.className = className
		root.innerHTML = el.innerHTML

		const resize_id = setInterval(() => {
			if (root.offsetHeight < el.offsetHeight)
			{
				root.style.height = (50 + (root.offsetHeight)) + 'px'
				root.scrollTop = Math.max(root.scrollHeight, root.clientHeight) - root.clientHeight;
				return;
			}

			root.style.overflow = ''
			document.body.removeChild(el);
			clearInterval(resize_id)
		}, 10)
	}

	render_loading(() => {
		fetch('./stats.js')
		    .then((response) => response.json())
		    .then((json) => render_nav(json))
		    .then((json) => render_chart(json, nav.src, nav.chart, nav.year))
	});
}
