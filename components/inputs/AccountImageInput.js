import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';

export default function AccountImageInput({ onImageSelected }) {
  const [image, setImage] = useState(null);

  const { isSmartphone } = useDeviceType();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need permission to access your photos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={[styles.pickButton, isSmartphone ? styles.pickButtonSmartphone : styles.pickButtonTablet]}>
        <View style={styles.placeholder}>
          <Ionicons name="camera-outline" size={isSmartphone ? 18 : 22} color={COLORS.gray300} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 50,
    overflow: 'hidden',
    left: 10,
    bottom: 30,
  },
  pickButtonSmartphone: {
    width: 40,
    height: 40,
    bottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray750,
  },
});