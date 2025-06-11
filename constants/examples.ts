/**
 * Random placeholder examples for the search input
 * These examples help users understand the variety of queries they can make
 */

export interface PlaceholderExample {
  fr: string;
  en: string;
  ja: string;
}

export const PLACEHOLDER_EXAMPLES: PlaceholderExample[] = [
  {
    fr: 'Un film ou une série avec Jennifer Aniston comme actrice principale, fin des années 90, disponible sur Amazon Prime',
    en: 'A movie or TV show with Jennifer Aniston as the lead actress, late 90s, available on Amazon Prime',
    ja: 'ジェニファー・アニストンが主演の90年代後半の映画やテレビ番組、Amazon Primeで視聴可能',
  },
  {
    fr: 'Un thriller psychologique coréen récent sur Netflix',
    en: 'A recent Korean psychological thriller on Netflix',
    ja: 'Netflixの最新韓国サイコロジカルスリラー',
  },
  {
    fr: "Des films d'animation Studio Ghibli pour une soirée nostalgique",
    en: 'Studio Ghibli animated films for a nostalgic evening',
    ja: '懐かしい夜のためのスタジオジブリアニメ映画',
  },
  {
    fr: 'Une comédie romantique française des années 2000',
    en: 'A French romantic comedy from the 2000s',
    ja: '2000年代のフランスロマンティックコメディ',
  },
  {
    fr: 'Série de science-fiction avec des voyages dans le temps',
    en: 'Sci-fi series with time travel',
    ja: 'タイムトラベルのあるSF シリーズ',
  },
  {
    fr: "Films d'horreur japonais classiques des années 90",
    en: 'Classic Japanese horror films from the 90s',
    ja: '90年代の古典的な日本のホラー映画',
  },
  {
    fr: 'Documentaires sur la nature disponibles sur Disney+',
    en: 'Nature documentaries available on Disney+',
    ja: 'Disney+で視聴可能な自然ドキュメンタリー',
  },
  {
    fr: 'Action avec des voitures et des courses',
    en: 'Action movies with cars and racing',
    ja: '車とレースのアクション映画',
  },
  {
    fr: 'Quelque chose de léger et drôle pour me détendre',
    en: 'Something light and funny to relax',
    ja: 'リラックスするための軽くて面白いもの',
  },
  {
    fr: 'Série policière britannique avec de bons dialogues',
    en: 'British crime series with good dialogue',
    ja: '良い対話のあるイギリスの犯罪シリーズ',
  },
  {
    fr: 'Films de super-héros Marvel récents',
    en: 'Recent Marvel superhero movies',
    ja: '最新のマーベルスーパーヒーロー映画',
  },
  {
    fr: 'Drame historique sur la Seconde Guerre mondiale',
    en: 'Historical drama about World War II',
    ja: '第二次世界大戦の歴史ドラマ',
  },
  {
    fr: 'Anime avec des robots géants et des combats épiques',
    en: 'Anime with giant robots and epic battles',
    ja: '巨大ロボットと壮大な戦いのあるアニメ',
  },
  {
    fr: 'Comédie américaine des années 80 avec Eddie Murphy',
    en: '80s American comedy with Eddie Murphy',
    ja: 'エディ・マーフィーの80年代アメリカンコメディ',
  },
  {
    fr: 'Thriller nordique sombre et atmosphérique',
    en: 'Dark and atmospheric Nordic thriller',
    ja: '暗くて雰囲気のある北欧スリラー',
  },
];

/**
 * Get a random placeholder example for the specified language
 * @param language - The language code (fr, en, ja)
 * @returns A random placeholder text in the specified language
 */
export function getRandomPlaceholder(language: 'fr' | 'en' | 'ja'): string {
  const randomIndex = Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length);
  return PLACEHOLDER_EXAMPLES[randomIndex][language];
}
