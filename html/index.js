onload = () => {

	const SRC_ALL = 0, SRC_FIRST = 1, SRC_LAST = 2, SRC_LAST_COMBINED = 3;

	const sort = (json, src) => {
		let stats = [], names = []

		const to_stats = (name, item) => {

			if (-1 == names.indexOf(name))
			{
				names.push(name);
			}
			let index = names.indexOf(name)

			stats[index] = stats[index] ?? {name: name, items: []}
			stats[index].items.push(item)
		}

		const to_stats_combined = (name, item) => {
			let key = name;
			key = key.replace(/ова?$/, 'oв(а)');
			key = key.replace(/ева?$/, 'eв(а)');
			key = key.replace(/(ски|ска)$/, 'ск(и/а)');

			to_stats(key, item)
		}

		json.map((item) => {
			let episode, first, last, year;
			[episode, first, last, year] = item;

			switch (src)
			{
				case SRC_ALL: return to_stats(first, item) || to_stats(last, item);
				case SRC_FIRST: return to_stats(first, item);
				case SRC_LAST: return to_stats(last, item);
				case SRC_LAST_COMBINED: return to_stats_combined(last, item);
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

	const root = document.getElementById('chart');

	const render_nav = (json) => {
		return json
	}

	const render_chart = (json, src, chart) => {
		const stats = sort(json, src);
		switch (chart)
		{
			case 0: return render_tag_cloud(stats);
		}
	};

	const render_loading = () => {
		root.style.height = '200px'

		root.className = 'loading d-flex align-items-center justify-content-center'
		root.innerHTML = '<div class="spinner-border" role="status">'
			+ '<span class="visually-hidden">Зареждане...</span>'
			+ '</div>';
	};

	const render_tag_cloud = (stats) => {
		const min_font = 13
		const max_font = 40

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
	        console.log('minWeight: '+min+', maxWeight: '+max+', a: '+a+', b: '+b);

		stats.map((item, i) => {
			const span = document.createElement('span')

			const size = Math.ceil(parseInt((a * item.items.length + b) * 10, 10) / 10);
			span.style.fontSize = size + 'px'

			span.className = 'btn btn-info'

			span.innerHTML = item.name
				+ ' <span class="badge rounded-pill text-bg-dark">'
				+ item.items.length
				+ '</span>'

			chart.appendChild( span )
			chart.appendChild( document.createTextNode(' ') )
		})

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
	    .then((json) => render_chart(json, SRC_LAST_COMBINED, 0));
}
