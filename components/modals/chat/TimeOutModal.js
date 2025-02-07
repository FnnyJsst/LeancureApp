import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../../constants/style';

export default function TimeOutModal({ visible, onClose }) {
  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        <Text>Time Out Modal</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray900,
  },
});

