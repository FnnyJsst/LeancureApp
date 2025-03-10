import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, StatusBar, Animated } from 'react-native';
import { COLORS } from '../../constants/style';

/**
 * @component ScreenSaver
 * @description Displays the screen saver
 *
 * @returns {JSX.Element} - A JSX element
 *
 * @example
 * <ScreenSaver />
 */
export default function ScreenSaver() {
  console.log('🎨 Rendu du ScreenSaver');
  // Utiliser useRef pour éviter de recréer l'animation à chaque rendu
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('🎬 Démarrage de l\'animation du ScreenSaver');
    // Animation d'entrée en fondu
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      console.log('✨ Animation du ScreenSaver terminée');
    });

    return () => {
      console.log('🔚 Nettoyage du ScreenSaver');
      fadeAnim.setValue(0);
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            backgroundColor: COLORS.gray900,
          }
        ]}
      >
        <Image
          source={require('../../assets/images/screensaver_anim.png')}
          style={styles.image}
          resizeMode="contain"
          onLoad={() => console.log('🖼️ Image du ScreenSaver chargée')}
          onError={(error) => console.log('❌ Erreur de chargement de l\'image:', error)}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray900,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 999, // Pour Android
    zIndex: 999, // Pour iOS
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
  },
});
