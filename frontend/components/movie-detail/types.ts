export interface StreamingProvider {
  provider_id?: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
  availability_type?: 'flatrate' | 'rent' | 'buy' | 'ads';
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string | null;
}

export interface CrewMemberData {
  id: number;
  name: string;
  job: string;
  profile_path?: string | null;
}

export interface DetailedInfoData {
  genres?: { id: number; name: string }[];
  runtime?: number;
  release_year?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  first_air_year?: number;
  tagline?: string;
  budget?: number;
  revenue?: number;
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  original_language?: string;
  original_title?: string;
  imdb_id?: string;
  belongs_to_collection?: { id: number; name: string; poster_path: string | null } | null;
  created_by?: { id: number; name: string; profile_path: string | null }[];
  networks?: { id: number; name: string; logo_path: string | null }[];
  last_episode_to_air?: { episode_number: number; season_number: number; name: string; air_date: string } | null;
  next_episode_to_air?: { episode_number: number; season_number: number; name: string; air_date: string } | null;
  in_production?: boolean;
  production_countries?: { iso_3166_1: string; name: string }[];
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
}

export interface SimilarMovie {
  id: number;
  title: string;
  posterPath: string;
  mediaType: 'movie' | 'tv';
  voteAverage: number;
}
