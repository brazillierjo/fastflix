import { useLanguage } from '@/contexts/LanguageContext';
import { MotiView } from 'moti';
import React from 'react';
import {
  Dimensions,
  PanResponder,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  numberOfRecommendations: number;
  setNumberOfRecommendations: (count: number) => void;
  includeMovies: boolean;
  setIncludeMovies: (include: boolean) => void;
  includeTvShows: boolean;
  setIncludeTvShows: (include: boolean) => void;
  onSearch: () => void;
  loading: boolean;
}

export default function SearchForm({
  query,
  setQuery,
  numberOfRecommendations,
  setNumberOfRecommendations,
  includeMovies,
  setIncludeMovies,
  includeTvShows,
  setIncludeTvShows,
  onSearch,
  loading,
}: SearchFormProps) {
  const { t } = useLanguage();
  const screenWidth = Dimensions.get('window').width;
  const sliderWidth = screenWidth - 48;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: event => {
      const { locationX } = event.nativeEvent;
      const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
      const newValue = Math.round(percentage * 9) + 1;
      setNumberOfRecommendations(newValue);
    },
  });

  return (
    <>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          delay: 300,
          type: 'timing',
          duration: 600,
        }}
        style={{
          marginBottom: 24,
        }}
      >
        <TextInput
          style={{
            backgroundColor: '#f5f5f5',
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            color: '#000',
            minHeight: 100,
            textAlignVertical: 'top',
          }}
          placeholder={t('welcome.inputPlaceholder')}
          placeholderTextColor='#999'
          value={query}
          onChangeText={setQuery}
          multiline
          maxLength={200}
        />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          delay: 500,
          type: 'timing',
          duration: 600,
        }}
        style={{
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#000',
            marginBottom: 16,
          }}
        >
          {t('welcome.options')}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: '#000',
            }}
          >
            {t('settings.numberOfRecommendations')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                backgroundColor: '#000',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 4,
                minWidth: 40,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#fff',
                }}
              >
                {numberOfRecommendations}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <View
            {...panResponder.panHandlers}
            style={{
              height: 20,
              justifyContent: 'center',
              paddingVertical: 8,
            }}
          >
            <View
              style={{
                height: 4,
                backgroundColor: '#f0f0f0',
                borderRadius: 2,
                position: 'relative',
              }}
            >
              <View
                style={{
                  height: 4,
                  backgroundColor: '#000',
                  borderRadius: 2,
                  width: `${((numberOfRecommendations - 1) / 9) * 100}%`,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: `${((numberOfRecommendations - 1) / 9) * 100}%`,
                  top: -6,
                  width: 16,
                  height: 16,
                  backgroundColor: '#000',
                  borderRadius: 8,
                  marginLeft: -8,
                }}
              />
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setIncludeMovies(!includeMovies)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: includeMovies ? '#000' : '#f5f5f5',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: includeMovies ? '#fff' : '#000',
              }}
            >
              {t('settings.movies')}
            </Text>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: includeMovies ? '#fff' : '#ddd',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {includeMovies && (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#000',
                  }}
                >
                  ✓
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIncludeTvShows(!includeTvShows)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: includeTvShows ? '#000' : '#f5f5f5',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: includeTvShows ? '#fff' : '#000',
              }}
            >
              {t('settings.tvShows')}
            </Text>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: includeTvShows ? '#fff' : '#ddd',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {includeTvShows && (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#000',
                  }}
                >
                  ✓
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          delay: 700,
          type: 'timing',
          duration: 600,
        }}
      >
        <TouchableOpacity
          onPress={onSearch}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#000',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#fff',
            }}
          >
            {loading ? t('welcome.generating') : t('welcome.searchButton')}
          </Text>
        </TouchableOpacity>
      </MotiView>
    </>
  );
}
