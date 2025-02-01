onload = () => {

	const SRC_ALL = 0, SRC_FIRST = 1, SRC_LAST = 2, SRC_FAMILY = 3, SRC_FULL = 4;
	const CHART_TAG_LIST = 0, CHART_TAG_CLOUD = 1;

	const sort = (json, src) => {
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

	let nav = {src: SRC_FAMILY, chart: CHART_TAG_CLOUD, year: -1}

	const set_dropdown_title = (el, label, current) => {
		el.innerHTML = label + ': <strong>' + current + '</strong>'
	}

	const click_nav = (json, button, index, target, label) => {
		button.parentNode.parentNode.childNodes[ nav[target] ].firstChild.className = button.className
		button.className += ' active'

		set_dropdown_title(
			button.parentNode.parentNode.parentNode.firstChild,
			label,
			button.innerHTML
		)

		nav[target] = index

		render_loading();
		setTimeout(() => render_chart(json, nav.src, nav.chart), 400)
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
		set_dropdown_title(selected, label, options[current] || '💩')

		const ul = document.createElement('ul')
		ul.className = 'dropdown-menu'
		li.appendChild(ul)

		options.map((option, index) => {
			const command = document.createElement('button')
			command.type = 'button'
			command.className = 'dropdown-item' + (index == current ? ' active' : '')
			command.innerHTML = option
			command.addEventListener(
				'click',
				(e) => click_nav(json, command, index, target, label)
			)

			const li = document.createElement('li')
			li.appendChild(command)

			ul.appendChild(li)
		})

		new bootstrap.Dropdown(selected)

		return li
	}

	const render_nav = (json) => {

		const control = document.getElementById('control')

		let name_options = ['Лични + Фамилни', 'Лични имена', 'Фамилни имена', 'Фамилии']
		control.appendChild( compose_nav('Имена', SRC_FAMILY, name_options, 'src', json) )
		// control.replaceChildren(document.createTextNode('*'));

		return json
	}

	let sorted = []
	const render_chart = (json, src, chart) => {
		const stats = sort(json, src)
		switch (chart)
		{
			case CHART_TAG_LIST:
				return render_tag_list(stats)

			case CHART_TAG_CLOUD:
				return render_tag_cloud(stats)
		}
	};

	const render_loading = () => {
		root.style.height = '200px'

		root.className = 'loading d-flex align-items-center justify-content-center'
		root.innerHTML = '<div class="spinner-border" role="status">'
			+ '<span class="visually-hidden">Зареждане...</span>'
			+ '</div>';
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
		const tags = Array.from(chart.getElementsByClassName('stigmo-tag'))

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
				root.style.height = (20 + (root.offsetHeight)) + 'px'
				root.scrollTop = Math.max(root.scrollHeight, root.clientHeight) - root.clientHeight;
				return;
			}

			root.style.overflow = ''
			document.body.removeChild(el);
			clearInterval(resize_id)
		}, 10)
	}

	render_loading();

	fetch('./stats.js')
	    .then((response) => response.json())
	    .then((json) => render_nav(json))
	    .then((json) => render_chart(json, nav.src, nav.chart))
}
