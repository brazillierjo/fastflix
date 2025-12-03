/**
 * Random placeholder examples for the search input
 * These examples help users understand the variety of queries they can make
 *
 * Categories:
 * - Fun/Quirky moods
 * - Emotional moments
 * - Nostalgic vibes
 * - Specific situations
 * - Genre deep-dives
 * - Actor/Director requests
 * - Platform-specific
 * - Seasonal/Occasion
 */

export interface PlaceholderExample {
  fr: string;
  en: string;
  ja: string;
  it: string;
  es: string;
  de: string;
}

export const PLACEHOLDER_EXAMPLES: PlaceholderExample[] = [
  // ============================================
  // 🎭 FUN & QUIRKY MOODS
  // ============================================
  {
    fr: "Un film tellement mauvais qu'il en devient culte",
    en: "A movie so bad it's actually good",
    ja: '逆に名作になるほどひどい映画',
    it: 'Un film così brutto da essere diventato cult',
    es: 'Una película tan mala que se volvió de culto',
    de: 'Ein Film so schlecht, dass er Kult wurde',
  },
  {
    fr: "Quelque chose pour rire comme un idiot à 2h du mat'",
    en: 'Something to laugh like an idiot at 2am',
    ja: '深夜2時にバカ笑いできるもの',
    it: 'Qualcosa per ridere come uno scemo alle 2 di notte',
    es: 'Algo para reírme como tonto a las 2am',
    de: 'Etwas zum Lachen wie ein Idiot um 2 Uhr nachts',
  },
  {
    fr: 'Un film avec des chats qui font des trucs stupides',
    en: 'A movie with cats doing stupid things',
    ja: '猫がおバカなことをする映画',
    it: 'Un film con gatti che fanno cose stupide',
    es: 'Una película con gatos haciendo cosas estúpidas',
    de: 'Ein Film mit Katzen die dumme Sachen machen',
  },
  {
    fr: 'Un navet des années 80 avec des effets spéciaux ridicules',
    en: 'A cheesy 80s movie with ridiculous special effects',
    ja: 'バカバカしい特殊効果の80年代B級映画',
    it: 'Un film trash anni 80 con effetti speciali ridicoli',
    es: 'Una película cutre de los 80 con efectos especiales ridículos',
    de: 'Ein trashiger 80er Film mit lächerlichen Spezialeffekten',
  },
  {
    fr: 'Nicolas Cage dans un de ses rôles les plus fous',
    en: 'Nicolas Cage at his most unhinged',
    ja: '最も狂気的なニコラス・ケイジ',
    it: 'Nicolas Cage nei suoi ruoli più folli',
    es: 'Nicolas Cage en sus papeles más locos',
    de: 'Nicolas Cage in seinen verrücktesten Rollen',
  },
  {
    fr: 'Un film de requin complètement débile',
    en: 'A completely ridiculous shark movie',
    ja: '完全にばかげたサメ映画',
    it: 'Un film di squali completamente stupido',
    es: 'Una película de tiburones completamente ridícula',
    de: 'Ein völlig bescheuerter Hai-Film',
  },

  // ============================================
  // 😢 EMOTIONAL MOMENTS
  // ============================================
  {
    fr: "Un film qui va me faire pleurer toutes les larmes de mon corps",
    en: "A movie that will make me cry my eyes out",
    ja: '号泣できる映画',
    it: 'Un film che mi farà piangere tutte le lacrime',
    es: 'Una película que me hará llorar a mares',
    de: 'Ein Film bei dem ich heulen werde wie ein Schlosshund',
  },
  {
    fr: "Quelque chose de touchant sur l'amitié",
    en: 'Something touching about friendship',
    ja: '友情についての感動的なもの',
    it: "Qualcosa di toccante sull'amicizia",
    es: 'Algo conmovedor sobre la amistad',
    de: 'Etwas Berührendes über Freundschaft',
  },
  {
    fr: 'Un film sur le deuil qui aide à guérir',
    en: 'A movie about grief that helps heal',
    ja: '癒しになる悲しみについての映画',
    it: 'Un film sul lutto che aiuta a guarire',
    es: 'Una película sobre el duelo que ayuda a sanar',
    de: 'Ein Film über Trauer der beim Heilen hilft',
  },
  {
    fr: 'Une histoire père-fils qui fait réfléchir',
    en: 'A thought-provoking father-son story',
    ja: '考えさせられる父と息子の物語',
    it: 'Una storia padre-figlio che fa riflettere',
    es: 'Una historia padre-hijo que hace reflexionar',
    de: 'Eine nachdenkliche Vater-Sohn Geschichte',
  },
  {
    fr: "Un film sur le premier amour qui rend nostalgique",
    en: "A first love movie that makes you nostalgic",
    ja: '懐かしくなる初恋映画',
    it: "Un film sul primo amore che rende nostalgici",
    es: 'Una película sobre el primer amor que da nostalgia',
    de: 'Ein Film über erste Liebe der nostalgisch macht',
  },
  {
    fr: 'Un film feel-good pour remonter le moral',
    en: 'A feel-good movie to lift my spirits',
    ja: '気分を上げるフィールグッド映画',
    it: 'Un film feel-good per tirare su il morale',
    es: 'Una película feel-good para levantarme el ánimo',
    de: 'Ein Feel-Good Film der die Laune hebt',
  },

  // ============================================
  // 🕰️ NOSTALGIC VIBES
  // ============================================
  {
    fr: 'Les films de mon enfance des années 90',
    en: 'Movies from my 90s childhood',
    ja: '90年代の子供時代の映画',
    it: "I film della mia infanzia negli anni 90",
    es: 'Películas de mi infancia de los 90',
    de: 'Filme aus meiner 90er Kindheit',
  },
  {
    fr: 'Un Disney que je regardais en boucle petit',
    en: 'A Disney movie I watched on repeat as a kid',
    ja: '子供の頃リピートしたディズニー映画',
    it: 'Un Disney che guardavo sempre da piccolo',
    es: 'Una Disney que veía en bucle de pequeño',
    de: 'Ein Disney den ich als Kind in Dauerschleife sah',
  },
  {
    fr: 'Séries américaines cultes des années 2000',
    en: 'Iconic American TV shows from the 2000s',
    ja: '2000年代の象徴的なアメリカのドラマ',
    it: 'Serie americane cult degli anni 2000',
    es: 'Series americanas icónicas de los 2000',
    de: 'Kultige amerikanische Serien der 2000er',
  },
  {
    fr: "Les comédies françaises que tout le monde cite",
    en: 'French comedies everyone quotes',
    ja: 'みんなが引用するフランスコメディ',
    it: 'Commedie francesi che tutti citano',
    es: 'Comedias francesas que todo el mundo cita',
    de: 'Französische Komödien die jeder zitiert',
  },
  {
    fr: 'Un classique en noir et blanc que je devrais voir',
    en: 'A black and white classic I should watch',
    ja: '見るべき白黒の名作',
    it: 'Un classico in bianco e nero che dovrei vedere',
    es: 'Un clásico en blanco y negro que debería ver',
    de: 'Ein Schwarz-Weiß Klassiker den ich sehen sollte',
  },

  // ============================================
  // 🌙 SPECIFIC SITUATIONS
  // ============================================
  {
    fr: 'Quelque chose de léger pour une soirée pizza',
    en: 'Something light for a pizza night',
    ja: 'ピザナイトに軽いもの',
    it: 'Qualcosa di leggero per una serata pizza',
    es: 'Algo ligero para una noche de pizza',
    de: 'Etwas Leichtes für einen Pizza Abend',
  },
  {
    fr: 'Un film à regarder sous la couette un dimanche pluvieux',
    en: 'A movie to watch under a blanket on a rainy Sunday',
    ja: '雨の日曜日に布団で見る映画',
    it: 'Un film da guardare sotto le coperte una domenica piovosa',
    es: 'Una película para ver bajo la manta un domingo lluvioso',
    de: 'Ein Film für regnerische Sonntage unter der Decke',
  },
  {
    fr: 'Un truc efficace pour un premier date',
    en: 'A safe choice for a first date',
    ja: '初デートに無難な映画',
    it: 'Qualcosa di sicuro per un primo appuntamento',
    es: 'Algo seguro para una primera cita',
    de: 'Ein sicherer Film fürs erste Date',
  },
  {
    fr: "Un film à regarder avec ma grand-mère",
    en: 'A movie to watch with my grandmother',
    ja: 'おばあちゃんと見る映画',
    it: 'Un film da guardare con mia nonna',
    es: 'Una película para ver con mi abuela',
    de: 'Ein Film zum Anschauen mit meiner Oma',
  },
  {
    fr: 'Quelque chose pour ma mère qui adore les romances',
    en: 'Something for my mom who loves romances',
    ja: 'ロマンス好きの母に',
    it: 'Qualcosa per mia madre che adora le storie romantiche',
    es: 'Algo para mi madre que adora las películas románticas',
    de: 'Etwas für meine Mutter die Romanzen liebt',
  },
  {
    fr: 'Un film pour impressionner quelqu\'un qui dit "j\'ai tout vu"',
    en: 'A movie to impress someone who says "I\'ve seen everything"',
    ja: '「全部見た」と言う人を感心させる映画',
    it: 'Un film per impressionare chi dice "ho visto tutto"',
    es: 'Una película para impresionar a alguien que dice "ya lo vi todo"',
    de: 'Ein Film um jemanden zu beeindrucken der "alles gesehen hat"',
  },
  {
    fr: 'Un film court pour une pause déjeuner',
    en: 'A short movie for a lunch break',
    ja: 'ランチ休憩用の短い映画',
    it: 'Un film corto per la pausa pranzo',
    es: 'Una película corta para la hora del almuerzo',
    de: 'Ein kurzer Film für die Mittagspause',
  },

  // ============================================
  // 🎬 GENRE DEEP-DIVES
  // ============================================
  {
    fr: 'Un thriller psychologique qui retourne le cerveau',
    en: 'A mind-bending psychological thriller',
    ja: '脳がひっくり返るサイコスリラー',
    it: 'Un thriller psicologico che ti sconvolge la mente',
    es: 'Un thriller psicológico que te vuela la cabeza',
    de: 'Ein Psychothriller der das Gehirn verdreht',
  },
  {
    fr: "Un film d'horreur vraiment flippant pas juste gore",
    en: 'A truly scary horror movie not just gore',
    ja: 'グロではなく本当に怖いホラー映画',
    it: 'Un horror davvero spaventoso non solo gore',
    es: 'Una película de terror realmente aterradora no solo gore',
    de: 'Ein wirklich gruseliger Horrorfilm nicht nur Splatter',
  },
  {
    fr: 'De la science-fiction intelligente qui fait réfléchir',
    en: 'Smart sci-fi that makes you think',
    ja: '考えさせられる知的なSF',
    it: 'Fantascienza intelligente che fa riflettere',
    es: 'Ciencia ficción inteligente que hace pensar',
    de: 'Intelligente Sci-Fi die zum Nachdenken anregt',
  },
  {
    fr: 'Un western spaghetti iconique',
    en: 'An iconic spaghetti western',
    ja: '象徴的なマカロニウエスタン',
    it: 'Uno spaghetti western iconico',
    es: 'Un western spaghetti icónico',
    de: 'Ein ikonischer Spaghetti-Western',
  },
  {
    fr: 'Film noir des années 40 avec une femme fatale',
    en: '40s film noir with a femme fatale',
    ja: 'ファム・ファタールが出る40年代フィルム・ノワール',
    it: 'Film noir anni 40 con una femme fatale',
    es: 'Cine negro de los 40 con una femme fatale',
    de: '40er Film Noir mit einer Femme Fatale',
  },
  {
    fr: 'Un bon film de braquage bien ficelé',
    en: 'A well-crafted heist movie',
    ja: '緻密に作られた強盗映画',
    it: 'Un bel film di rapina ben costruito',
    es: 'Una buena película de atracos bien hecha',
    de: 'Ein gut gemachter Heist-Film',
  },
  {
    fr: 'Un drame juridique avec des retournements',
    en: 'A legal drama with twists',
    ja: 'どんでん返しのある法廷ドラマ',
    it: 'Un legal drama con colpi di scena',
    es: 'Un drama judicial con giros',
    de: 'Ein Gerichtsdrama mit Wendungen',
  },

  // ============================================
  // 🌍 WORLD CINEMA
  // ============================================
  {
    fr: 'Un thriller coréen avec un twist de ouf',
    en: 'A Korean thriller with an insane twist',
    ja: 'ヤバいどんでん返しの韓国スリラー',
    it: 'Un thriller coreano con un colpo di scena pazzesco',
    es: 'Un thriller coreano con un giro increíble',
    de: 'Ein koreanischer Thriller mit krankem Twist',
  },
  {
    fr: "Bollywood avec des chorés de malade",
    en: 'Bollywood with insane choreography',
    ja: 'すごい振付のボリウッド',
    it: 'Bollywood con coreografie pazzesche',
    es: 'Bollywood con coreografías increíbles',
    de: 'Bollywood mit verrückten Choreografien',
  },
  {
    fr: 'Cinéma japonais contemplatif et poétique',
    en: 'Contemplative and poetic Japanese cinema',
    ja: '瞑想的で詩的な日本映画',
    it: 'Cinema giapponese contemplativo e poetico',
    es: 'Cine japonés contemplativo y poético',
    de: 'Kontemplatives poetisches japanisches Kino',
  },
  {
    fr: 'Un film scandinave sombre et atmosphérique',
    en: 'A dark and atmospheric Scandinavian film',
    ja: '暗く雰囲気のある北欧映画',
    it: 'Un film scandinavo cupo e atmosferico',
    es: 'Una película escandinava oscura y atmosférica',
    de: 'Ein dunkler atmosphärischer skandinavischer Film',
  },
  {
    fr: 'Du cinéma iranien primé',
    en: 'Award-winning Iranian cinema',
    ja: '受賞歴のあるイラン映画',
    it: 'Cinema iraniano premiato',
    es: 'Cine iraní premiado',
    de: 'Preisgekröntes iranisches Kino',
  },
  {
    fr: "Film d'auteur français un peu bizarre",
    en: 'A slightly weird French arthouse film',
    ja: 'ちょっと変なフランスのアート映画',
    it: "Film d'autore francese un po' strano",
    es: 'Película de autor francesa un poco rara',
    de: 'Ein etwas seltsamer französischer Autorenfilm',
  },

  // ============================================
  // 🎭 ACTORS & DIRECTORS
  // ============================================
  {
    fr: 'Le meilleur film de Christopher Nolan',
    en: "Christopher Nolan's best movie",
    ja: 'クリストファー・ノーランの最高傑作',
    it: 'Il miglior film di Christopher Nolan',
    es: 'La mejor película de Christopher Nolan',
    de: 'Christopher Nolans bester Film',
  },
  {
    fr: 'Un Tarantino que je n\'ai pas encore vu',
    en: "A Tarantino I haven't seen yet",
    ja: 'まだ見ていないタランティーノ作品',
    it: 'Un Tarantino che non ho ancora visto',
    es: 'Un Tarantino que aún no he visto',
    de: 'Ein Tarantino den ich noch nicht gesehen habe',
  },
  {
    fr: "Timothée Chalamet dans quelque chose d'intense",
    en: 'Timothée Chalamet in something intense',
    ja: 'ティモシー・シャラメの強烈な作品',
    it: 'Timothée Chalamet in qualcosa di intenso',
    es: 'Timothée Chalamet en algo intenso',
    de: 'Timothée Chalamet in etwas Intensivem',
  },
  {
    fr: 'Un film où Meryl Streep est incroyable',
    en: 'A movie where Meryl Streep is incredible',
    ja: 'メリル・ストリープが素晴らしい映画',
    it: 'Un film dove Meryl Streep è incredibile',
    es: 'Una película donde Meryl Streep está increíble',
    de: 'Ein Film in dem Meryl Streep unglaublich ist',
  },
  {
    fr: 'Le duo DiCaprio / Scorsese',
    en: 'DiCaprio and Scorsese collaboration',
    ja: 'ディカプリオとスコセッシのコラボ',
    it: 'Il duo DiCaprio / Scorsese',
    es: 'El dúo DiCaprio / Scorsese',
    de: 'DiCaprio und Scorsese Zusammenarbeit',
  },
  {
    fr: 'Un film de Denis Villeneuve visuellement époustouflant',
    en: 'A visually stunning Denis Villeneuve film',
    ja: '視覚的に圧倒的なドゥニ・ヴィルヌーヴ作品',
    it: 'Un film di Denis Villeneuve visivamente sbalorditivo',
    es: 'Una película de Denis Villeneuve visualmente impresionante',
    de: 'Ein visuell atemberaubender Denis Villeneuve Film',
  },
  {
    fr: 'Florence Pugh dans un rôle puissant',
    en: 'Florence Pugh in a powerful role',
    ja: 'フローレンス・ピューの力強い役',
    it: 'Florence Pugh in un ruolo potente',
    es: 'Florence Pugh en un papel poderoso',
    de: 'Florence Pugh in einer starken Rolle',
  },
  {
    fr: "Un film d'Hayao Miyazaki plein de magie",
    en: 'A magical Hayao Miyazaki film',
    ja: '魔法に満ちた宮崎駿作品',
    it: 'Un film di Hayao Miyazaki pieno di magia',
    es: 'Una película de Hayao Miyazaki llena de magia',
    de: 'Ein magischer Hayao Miyazaki Film',
  },

  // ============================================
  // 📺 PLATFORM-SPECIFIC
  // ============================================
  {
    fr: 'Les pépites cachées de Netflix',
    en: 'Hidden gems on Netflix',
    ja: 'Netflixの隠れた名作',
    it: 'Le perle nascoste di Netflix',
    es: 'Las joyas ocultas de Netflix',
    de: 'Versteckte Perlen auf Netflix',
  },
  {
    fr: "Ce qu'il y a de nouveau sur Disney+",
    en: "What's new on Disney+",
    ja: 'Disney+の新着',
    it: 'Le novità su Disney+',
    es: 'Lo nuevo en Disney+',
    de: 'Was gibt es Neues auf Disney+',
  },
  {
    fr: 'Une série Apple TV+ dont tout le monde parle',
    en: 'An Apple TV+ series everyone is talking about',
    ja: 'みんなが話題にしているApple TV+シリーズ',
    it: 'Una serie Apple TV+ di cui parlano tutti',
    es: 'Una serie de Apple TV+ de la que todos hablan',
    de: 'Eine Apple TV+ Serie über die alle reden',
  },
  {
    fr: 'Une série originale Amazon Prime à ne pas louper',
    en: 'An Amazon Prime original not to miss',
    ja: '見逃せないAmazon Primeオリジナル',
    it: 'Una serie originale Amazon Prime da non perdere',
    es: 'Una serie original de Amazon Prime que no te puedes perder',
    de: 'Ein Amazon Prime Original das man nicht verpassen sollte',
  },
  {
    fr: 'Une exclusivité HBO Max/Max à voir absolument',
    en: 'A must-watch HBO Max/Max exclusive',
    ja: '必見のHBO Max/Max独占作品',
    it: "Un'esclusiva HBO Max/Max da vedere assolutamente",
    es: 'Una exclusiva de HBO Max/Max que hay que ver',
    de: 'Ein HBO Max/Max Exklusiv das man sehen muss',
  },

  // ============================================
  // 🎄 SEASONAL & OCCASIONS
  // ============================================
  {
    fr: 'Un film de Noël pas trop cucul',
    en: 'A Christmas movie that is not too cheesy',
    ja: 'ベタすぎないクリスマス映画',
    it: 'Un film di Natale non troppo sdolcinato',
    es: 'Una película de Navidad que no sea demasiado cursi',
    de: 'Ein Weihnachtsfilm der nicht zu kitschig ist',
  },
  {
    fr: "Un film d'horreur pour Halloween",
    en: 'A horror movie for Halloween',
    ja: 'ハロウィン用のホラー映画',
    it: 'Un film horror per Halloween',
    es: 'Una película de terror para Halloween',
    de: 'Ein Horrorfilm für Halloween',
  },
  {
    fr: "Un film d'été qui donne envie de partir en vacances",
    en: 'A summer movie that makes you want to travel',
    ja: '旅行したくなる夏映画',
    it: "Un film estivo che fa venire voglia di partire",
    es: 'Una película de verano que da ganas de viajar',
    de: 'Ein Sommerfilm der Reiselust macht',
  },
  {
    fr: 'Une comédie romantique pour la Saint-Valentin',
    en: "A romantic comedy for Valentine's Day",
    ja: 'バレンタイン用のロマコメ',
    it: 'Una commedia romantica per San Valentino',
    es: 'Una comedia romántica para San Valentín',
    de: 'Eine romantische Komödie zum Valentinstag',
  },

  // ============================================
  // 🧠 SMART & CHALLENGING
  // ============================================
  {
    fr: 'Un film qui demande un deuxième visionnage',
    en: 'A movie that requires a second viewing',
    ja: '2回目の視聴が必要な映画',
    it: 'Un film che richiede una seconda visione',
    es: 'Una película que requiere verla dos veces',
    de: 'Ein Film den man zweimal sehen muss',
  },
  {
    fr: 'Un documentaire qui change la vision du monde',
    en: 'A documentary that changes your worldview',
    ja: '世界観が変わるドキュメンタリー',
    it: 'Un documentario che cambia la visione del mondo',
    es: 'Un documental que cambia tu visión del mundo',
    de: 'Eine Doku die die Weltsicht verändert',
  },
  {
    fr: 'Un film indépendant primé à Cannes',
    en: 'An independent film awarded at Cannes',
    ja: 'カンヌで受賞したインディー映画',
    it: 'Un film indipendente premiato a Cannes',
    es: 'Una película independiente premiada en Cannes',
    de: 'Ein unabhängiger Film der in Cannes ausgezeichnet wurde',
  },
  {
    fr: 'Un film expérimental qui sort de l\'ordinaire',
    en: 'An experimental film that breaks conventions',
    ja: '常識を覆す実験映画',
    it: 'Un film sperimentale fuori dagli schemi',
    es: 'Una película experimental que rompe moldes',
    de: 'Ein experimenteller Film der aus der Reihe tanzt',
  },

  // ============================================
  // 👨‍👩‍👧‍👦 FAMILY & KIDS
  // ============================================
  {
    fr: 'Un Pixar pour pleurer avec mes enfants',
    en: 'A Pixar movie to cry with my kids',
    ja: '子供と泣けるピクサー映画',
    it: 'Un Pixar per piangere con i miei figli',
    es: 'Una Pixar para llorar con mis hijos',
    de: 'Ein Pixar Film zum Weinen mit meinen Kindern',
  },
  {
    fr: 'Un film pour enfants que les adultes apprécient aussi',
    en: 'A kids movie that adults enjoy too',
    ja: '大人も楽しめる子供向け映画',
    it: 'Un film per bambini che piace anche agli adulti',
    es: 'Una película infantil que los adultos también disfrutan',
    de: 'Ein Kinderfilm den auch Erwachsene mögen',
  },
  {
    fr: 'Un film DreamWorks fun pour toute la famille',
    en: 'A fun DreamWorks movie for the whole family',
    ja: '家族全員で楽しめるドリームワークス映画',
    it: 'Un film DreamWorks divertente per tutta la famiglia',
    es: 'Una película de DreamWorks divertida para toda la familia',
    de: 'Ein lustiger DreamWorks Film für die ganze Familie',
  },

  // ============================================
  // 📺 TV SERIES SPECIFIC
  // ============================================
  {
    fr: 'Une série limitée à binge-watcher ce weekend',
    en: 'A limited series to binge-watch this weekend',
    ja: '週末に一気見できるリミテッドシリーズ',
    it: 'Una miniserie da guardare tutto il weekend',
    es: 'Una miniserie para maratonear este fin de semana',
    de: 'Eine Miniserie zum Binge-Watchen am Wochenende',
  },
  {
    fr: 'Une série avec moins de 3 saisons facile à finir',
    en: 'A series with less than 3 seasons easy to finish',
    ja: '3シーズン以下で完走しやすいシリーズ',
    it: 'Una serie con meno di 3 stagioni facile da finire',
    es: 'Una serie con menos de 3 temporadas fácil de terminar',
    de: 'Eine Serie mit weniger als 3 Staffeln die leicht zu beenden ist',
  },
  {
    fr: 'Un drama coréen addictif pour ne pas dormir',
    en: 'An addictive K-drama to stay up all night',
    ja: '徹夜してしまう中毒性の高い韓ドラ',
    it: 'Un drama coreano che crea dipendenza',
    es: 'Un drama coreano adictivo para no dormir',
    de: 'Ein süchtig machender K-Drama zum Durchmachen',
  },
  {
    fr: 'Une série britannique sarcastique bien écrite',
    en: 'A well-written sarcastic British series',
    ja: 'よく書かれた皮肉なイギリスドラマ',
    it: 'Una serie britannica sarcastica ben scritta',
    es: 'Una serie británica sarcástica bien escrita',
    de: 'Eine gut geschriebene sarkastische britische Serie',
  },

  // ============================================
  // 🎵 MUSICALS & MUSIC
  // ============================================
  {
    fr: 'Une comédie musicale qui donne envie de chanter',
    en: 'A musical that makes you want to sing',
    ja: '歌いたくなるミュージカル',
    it: 'Un musical che fa venire voglia di cantare',
    es: 'Un musical que da ganas de cantar',
    de: 'Ein Musical das zum Mitsingen einlädt',
  },
  {
    fr: 'Un biopic sur un musicien légendaire',
    en: 'A biopic about a legendary musician',
    ja: '伝説のミュージシャンの伝記映画',
    it: 'Un biopic su un musicista leggendario',
    es: 'Un biopic sobre un músico legendario',
    de: 'Ein Biopic über einen legendären Musiker',
  },
  {
    fr: 'Un film avec une bande-son incroyable',
    en: 'A movie with an incredible soundtrack',
    ja: '信じられないサウンドトラックの映画',
    it: 'Un film con una colonna sonora incredibile',
    es: 'Una película con una banda sonora increíble',
    de: 'Ein Film mit unglaublichem Soundtrack',
  },

  // ============================================
  // 🏆 AWARD WINNERS
  // ============================================
  {
    fr: "L'Oscar du meilleur film que je n'ai pas vu",
    en: "A Best Picture Oscar winner I haven't seen",
    ja: 'まだ見ていないアカデミー賞作品',
    it: "L'Oscar al miglior film che non ho visto",
    es: 'Un Oscar a mejor película que no he visto',
    de: 'Ein Oscar-Gewinner den ich noch nicht gesehen habe',
  },
  {
    fr: 'Un film primé aux César',
    en: 'A César award-winning film',
    ja: 'セザール賞受賞作品',
    it: 'Un film premiato ai César',
    es: 'Una película premiada en los César',
    de: 'Ein César-prämierter Film',
  },

  // ============================================
  // 💪 ACTION & ADVENTURE
  // ============================================
  {
    fr: 'Un film d\'action avec des explosions partout',
    en: 'An action movie with explosions everywhere',
    ja: '爆発だらけのアクション映画',
    it: "Un film d'azione con esplosioni ovunque",
    es: 'Una película de acción con explosiones por todos lados',
    de: 'Ein Actionfilm mit Explosionen überall',
  },
  {
    fr: 'Du John Wick mais en série',
    en: 'John Wick but as a series',
    ja: 'ジョン・ウィックみたいなシリーズ',
    it: 'John Wick ma in versione serie',
    es: 'John Wick pero en serie',
    de: 'John Wick aber als Serie',
  },
  {
    fr: 'Un film de super-héros pas Marvel ou DC',
    en: 'A superhero movie not Marvel or DC',
    ja: 'マーベルでもDCでもないスーパーヒーロー映画',
    it: 'Un film di supereroi non Marvel o DC',
    es: 'Una película de superhéroes que no sea Marvel ni DC',
    de: 'Ein Superheldenfilm der nicht Marvel oder DC ist',
  },

  // ============================================
  // 🔮 SCI-FI & FANTASY
  // ============================================
  {
    fr: 'De la hard science-fiction avec des concepts fous',
    en: 'Hard sci-fi with mind-blowing concepts',
    ja: '衝撃的なコンセプトのハードSF',
    it: 'Fantascienza hard con concetti incredibili',
    es: 'Ciencia ficción dura con conceptos alucinantes',
    de: 'Hard Sci-Fi mit verrückten Konzepten',
  },
  {
    fr: 'Un univers fantasy aussi riche que le Seigneur des Anneaux',
    en: 'A fantasy universe as rich as Lord of the Rings',
    ja: 'ロード・オブ・ザ・リングのように豊かなファンタジー世界',
    it: 'Un universo fantasy ricco come Il Signore degli Anelli',
    es: 'Un universo fantasy tan rico como El Señor de los Anillos',
    de: 'Ein Fantasy-Universum so reich wie Herr der Ringe',
  },
  {
    fr: 'Un film de voyage dans le temps qui tient la route',
    en: 'A time travel movie that makes sense',
    ja: '筋が通ったタイムトラベル映画',
    it: 'Un film sui viaggi nel tempo che abbia senso',
    es: 'Una película de viajes en el tiempo que tenga sentido',
    de: 'Ein Zeitreise-Film der Sinn ergibt',
  },

  // ============================================
  // 🎲 RANDOM & FUN
  // ============================================
  {
    fr: 'Surprends-moi avec quelque chose de complètement fou',
    en: 'Surprise me with something completely wild',
    ja: '完全に予想外のもので驚かせて',
    it: 'Sorprendimi con qualcosa di completamente folle',
    es: 'Sorpréndeme con algo completamente loco',
    de: 'Überrasch mich mit etwas völlig Verrücktem',
  },
  {
    fr: "N'importe quoi tant que c'est bien",
    en: "Anything as long as it's good",
    ja: '良ければ何でもいい',
    it: "Qualsiasi cosa basta che sia bello",
    es: 'Lo que sea mientras sea bueno',
    de: 'Egal was Hauptsache es ist gut',
  },
  {
    fr: 'Un film que personne ne connaît mais qui est génial',
    en: 'A movie nobody knows but is amazing',
    ja: '誰も知らないけど素晴らしい映画',
    it: 'Un film che nessuno conosce ma che è geniale',
    es: 'Una película que nadie conoce pero que es genial',
    de: 'Ein Film den niemand kennt aber der großartig ist',
  },
  {
    fr: 'Le film le plus sous-coté de tous les temps',
    en: 'The most underrated movie of all time',
    ja: '史上最も過小評価されている映画',
    it: 'Il film più sottovalutato di sempre',
    es: 'La película más subestimada de todos los tiempos',
    de: 'Der am meisten unterschätzte Film aller Zeiten',
  },
];

/**
 * Get a random placeholder example for the specified language
 * @param language - The language code (fr, en, ja, it, es, de)
 * @returns A random placeholder text in the specified language
 */
export function getRandomPlaceholder(
  language: 'fr' | 'en' | 'ja' | 'it' | 'es' | 'de'
): string {
  const randomIndex = Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length);
  return PLACEHOLDER_EXAMPLES[randomIndex][language];
}
