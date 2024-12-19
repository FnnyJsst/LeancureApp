import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from "../../../assets/styles/constants";

export default function DocumentPreviewModal({ visible, onClose, fileUrl }) {
  return (
    <Modal visible={visible} onRequestClose={onClose} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Document Preview</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.lightGray} />
            </TouchableOpacity>
          </View>
          <Text style={styles.fileUrl}>{fileUrl}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColorerRadius: SIZES.borderRadius.medium,
   padding: 20,
 },
 header: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   marginBottom: 20,
 },
 title: {
   color: 'white',
   fontSize: SIZES.fonts.large,
 },
 fileUrl: {
   color: COLORS.lightGray,
   fontSize: SIZES.fonts.medium,
 }
});
