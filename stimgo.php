<?php

(new class() {
	const FEED_URL = 'https://feeds.soundcloud.com/users/soundcloud:users:234169782/sounds.rss';

	const LOCAL_FEED_FILE = 'feed.xml';

	const PATH_TO_STATS_FILE = 'docs/stats.js';

	private const REGEXPS = [
		'~^Еп(?<episodeNumber>\d+) \| ( )?(Проф\. )?(д\-р )?(?<firstName>\w+) (?<lastName>\w+)\: ~u',
		'~^Eп(?<episodeNumber>\d+) \| (?<firstName>\w+) (?<lastName>\w+)\: ~u',
		'~^Еп(?<episodeNumber>\d+) \| (?<firstName>\w+) (?<lastName>\w+) \- .+\: ~u',
		'~^Еп(?<episodeNumber>\d+) \| (?<firstName>\w+) (?<lastName>\w+\-\w+)\: ~u',
		'~^Еп(?<episodeNumber>\d+) \| .+ (?:с|със) (?<firstName>\w+) (?<lastName>\w+)$~u',
		'~\| (?<firstName>\w+) (?<lastName>\w+) \| Еп(?<episodeNumber>\d+)$~u',
	];

	private const HARD_TO_PARSE_EPISODES = [
		'Еп410 | EN | Dr. Menis Yousry: Nothing in life can be forced!' =>
			[410, 'Менис', 'Юсри', 2024],
		'Еп384 | EN | Robert Vlach: Share what you know with others!' =>
			[384, 'Робърт', 'Влах', 2024],
		'Еп377 | EN | Moritz Zimmermann: Be ambitious. Be curious. Feel challenged.' =>
			[377, 'Мориц', 'Цимърман', 2023],
		'Eп269 | EN | Adrien Bacchi: I am grateful to Bulgaria because this is where it happened!' =>
			[269, 'Адриен', 'Баки', 2021],
		'Еп244 | EN | Peter Sage: The Questions are the Steering Wheel of the Mind' =>
			[244, 'Питър', 'Сейдж', 2021],
		'Еп230 | EN | Dennis Sheperd: Be patient and positive and the sunrise will come' =>
			[230, 'Денис', 'Шепърд', 2021],
		'Еп216 | Шеф Жоро Иванов: Човек трябва да има нагласата да се обучава през целия си професионален път' =>
			[216, 'Жоро', 'Иванов', 2020],
		'Еп186 | EN | Gabriel Marangoni: The black belt is not the end!' =>
			[186, 'Габриел', 'Марангони', 2020],
		'Еп170 | Доц. Д-р Милена Георгиева: ДНК не е нашата съдба!' =>
			[170, 'Милена', 'Георгиева', 2020],
		'Еп169 | EN | Dr. David Ryback: Helping others is really rewarding' =>
			[169, 'Дейвид', 'Райбек', 2019],
		'Еп160 | Богомила "Мила Боги" Трайкова: Себе си е нещо, което създаваш' =>
			[160, 'Богомила', 'Трайкова', 2019],
		'Еп118 | Стопан: Как е възможно сам да определяш своето възнаграждение?' =>
			[118, 'Калин', 'Даскалов', 2019],
		'Еп093 | EN | Mario Tomic: There is only ONE shortcut to your success' =>
			[93, 'Марио', 'Томич', 2018],
		'Еп084 | Екипът в основата на успеха - историята на Александър Сумин и ClaimCompass' =>
			[84, 'Александър', 'Сумин', 2018],
		'Еп078 | Да бъдеш в хармония с това, което имаш тук и сега с Евгения Пеева-Кирова' =>
			[78, 'Евгения', 'Пеева-Кирова', 2018],
		'Еп069 | За музиката като начин на изразяване със Станислав „Спенс“ Найденов' =>
			[69, 'Станислав', 'Найденов', 2017],
		'Еп019 | Как една похвала преобръща живота на Виктория "Goldy" Димитрова' =>
			[19, 'Виктория', 'Димитрова', 2017],
		'Еп005 | Как да превръщаме нещата в реалност с Преслав "Aethelthryth" Иванов' =>
			[5, 'Преслав', 'Иванов', 2016],
	];

	private array $names = [];

	function __construct()
	{
		chdir(__DIR__);
	}

	function download(): self
	{
		echo '[1] Downloading ', self::FEED_URL, "\n";

		$fromURL = self::FEED_URL;
		$asLocalFile = self::LOCAL_FEED_FILE;
		exec("curl '{$fromURL}' -o '{$asLocalFile}'");

		return $this;
	}

	function parse(): self
	{
		echo '[2] Parsing ', self::LOCAL_FEED_FILE, "\n";
		$xml = simplexml_load_file(self::LOCAL_FEED_FILE);

		foreach ($xml->channel->item as $item)
		{
			$title = (string) $item->title;
			if (!$this->isPodcastEpisode($title))
			{
				continue;
			}

			$found = false;
			foreach (self::REGEXPS as $regex)
			{
				if (preg_match($regex, $title, $matches))
				{
					$found = true;
					$this->addToNames(
						(int) $matches['episodeNumber'],
						$matches['firstName'],
						$matches['lastName'],
						(int) gmdate('Y', strToTime($item->pubDate))
					);

					break;
				}
			}

			if (array_key_exists($title, self::HARD_TO_PARSE_EPISODES))
			{
				$found = true;
				$this->addToNames(...self::HARD_TO_PARSE_EPISODES[$title]);
			}

			if ('Еп010 | За инициативите на Аз Мога - Тук и Сега с Константин и Алекса' == $title)
			{
				$found = true;
				$this->addToNames(10, 'Константин', 'Рачев', 2016);
				$this->addToNames(10, 'Алекса', 'Тачев', 2016);
			}

			if ('Еп067 | Супер Продуктивност със Зорница Стефанова и Силвина Фурнаджиева' == $title)
			{
				$found = true;
				$this->addToNames(67, 'Зорница', 'Стефанова', 2017);
				$this->addToNames(67, 'Силвина', 'Фурнаджиева', 2017);
			}

			if (!$found)
			{
				echo "<?> {$title}\n";
			}
		}

		return $this;
	}

	function save(): self
	{
		echo '[3] Saving ', self::PATH_TO_STATS_FILE, "\n";

		file_put_contents(
			self::PATH_TO_STATS_FILE,
			json_encode($this->names, \JSON_UNESCAPED_UNICODE /*| \JSON_PRETTY_PRINT*/)
		);

		return $this;
	}

	function push(): self
	{
		echo '[3] Pushing ', "\n";

		exec('git add ' . self::LOCAL_FEED_FILE);
		exec('git add ' . self::PATH_TO_STATS_FILE);
		exec('git commit -m "Updating statistics"');
		exec('git push');

		return $this;
	}

	private function isPodcastEpisode(string $title): bool
	{
		return !preg_match('~' . join('|', [
			'^LongevIT',
			'^На живо',
			'^Свръхчовекът на гости',
			'^Еп018 \| Как и защо създадох Свръхчовекът с Георги Ненов',
			'^Еп088 \| Георги Ненов\: Миналото и Бъдещето на Свръхчовекът',
			'^Еп070 \| Свръхчовешките уроци на 2017 с Георги Ненов',
			]) .'~u',
			$title
		);
	}

	private function addToNames(int $episodeNumber, string $firstName, string $lastName, int $year)
	{
		$this->names[] = [$episodeNumber, $firstName, $lastName, $year];
	}

})->download()->parse()->save()->push();
