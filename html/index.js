onload = () => {
	const colors = [
		'#db843d', '#92a8cd', '#a47d7c', '#058dc7', '#50b432', '#ed561b', '#24cbe5', '#64e572',
		'#ff9655', '#d6cb54', '#6af9c4', '#b5ca92', '#2f7ed8', '#5c40de', '#8bbc21', '#910000',
		'#1aadce', '#492970', '#f28f43', '#77a1e5', '#c42525', '#a6c96a', '#db843d', '#92a8cd',
		'#a47d7c', '#058dc7', '#50b432', '#ed561b', '#24cbe5', '#64e572', '#ff9655', '#d6cb54',
		'#6af9c4', '#b5ca92', '#2f7ed8', '#5c40de', '#8bbc21', '#910000', '#1aadce', '#492970',
		'#f28f43', '#77a1e5', '#c42525', '#a6c96a', '#db843d', '#92a8cd', '#a47d7c', '#058dc7',
		'#50b432', '#ed561b', '#24cbe5', '#64e572', '#ff9655', '#d6cb54', '#6af9c4', '#b5ca92',
		'#2f7ed8', '#5c40de', '#8bbc21', '#910000', '#1aadce', '#492970', '#f28f43', '#77a1e5'
		];

	const guess_color = (background) => {
		const rgb = background.match(/\d+/g)
		return ((parseInt(rgb[0], 16)*0.299)
				+(parseInt(rgb[1], 16)*0.587)
				+(parseInt(rgb[2], 16)*0.114)
			>314)
			? 'black'
			: 'white'
	}

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
		json.map((item) => {
			let episode, first, last, year;
			[episode, first, last, year] = item;

			switch (src)
			{
				case 0: return to_stats(first, item) || to_stats(last, item);
				case 1: return to_stats(first, item);
				case 2: return to_stats(last, item);
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

			span.style.backgroundColor = colors[ i % colors.length ]
			span.style.color = guess_color(span.style.backgroundColor)

			span.innerHTML = item.name + '(' + item.items.length + ';' + size + ')'
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
	    .then((json) => stats = json)
	    .then((json) => render_chart(json, 2, 0));
}
