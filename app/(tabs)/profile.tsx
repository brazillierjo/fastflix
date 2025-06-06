import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { Text, View } from 'react-native';

export default function ProfileScreen() {
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 60 }}>
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 40 }}>
          {t('settings.language')}
        </Text>

        <LanguageSelector
          style={{
            width: '80%',
            marginBottom: 20,
          }}
        />
      </View>
    </View>
  );
}
