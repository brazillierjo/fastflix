import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SCREEN_W } = Dimensions.get('window');

const TIPS = ['funFact1', 'funFact2', 'funFact3', 'funFact4', 'funFact5'];

interface CinematicLoaderProps {
  variant?: 'fullscreen' | 'inline';
}

export default function CinematicLoader({
  variant = 'fullscreen',
}: CinematicLoaderProps) {
  const { t } = useLanguage();
  const [tipIndex, setTipIndex] = useState(
    Math.floor(Math.random() * TIPS.length)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isFullscreen = variant === 'fullscreen';

  return (
    <View
      style={[
        styles.container,
        isFullscreen && styles.fullscreen,
        !isFullscreen && styles.inline,
      ]}
    >
      {isFullscreen && (
        <LinearGradient
          colors={['#0a0a0a', '#1a0a0a', '#0a0a0a']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Orbiting rings */}
      <View style={styles.orbContainer}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ rotate: `${i * 120}deg`, opacity: 0 }}
            animate={{ rotate: `${i * 120 + 360}deg`, opacity: 1 }}
            transition={{
              rotate: {
                type: 'timing',
                duration: 3000 + i * 500,
                loop: true,
              },
              opacity: { type: 'timing', duration: 600, delay: i * 150 },
            }}
            style={[
              styles.ring,
              {
                width: 60 + i * 20,
                height: 60 + i * 20,
                borderRadius: 30 + i * 10,
                borderColor: `rgba(229, 9, 20, ${0.6 - i * 0.15})`,
              },
            ]}
          />
        ))}

        {/* Center icon */}
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 200 }}
        >
          <MotiView
            from={{ scale: 1 }}
            animate={{ scale: 1.15 }}
            transition={{ type: 'timing', duration: 1200, loop: true }}
          >
            <Ionicons name="sparkles" size={28} color="#E50914" />
          </MotiView>
        </MotiView>
      </View>

      {/* Animated dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ opacity: 0.2, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: 'timing',
              duration: 600,
              delay: i * 200,
              loop: true,
            }}
            style={styles.dot}
          />
        ))}
      </View>

      {/* Rotating tip */}
      <MotiView
        key={tipIndex}
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: -8 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.tipContainer}
      >
        <Text
          style={[styles.tipText, !isFullscreen && styles.tipTextInline]}
          numberOfLines={2}
        >
          {t(`loading.${TIPS[tipIndex]}`) || 'Finding the perfect picks...'}
        </Text>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  inline: {
    flex: 1,
    paddingVertical: 60,
  },
  orbContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E50914',
  },
  tipContainer: {
    paddingHorizontal: 40,
    maxWidth: SCREEN_W * 0.85,
  },
  tipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  tipTextInline: {
    color: 'rgba(150,150,150,0.6)',
  },
});
