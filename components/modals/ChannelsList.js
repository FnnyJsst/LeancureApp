import { Modal, View, Text, StyleSheet } from 'react-native';
import Button from '../buttons/Button';
import TitleModal from '../text/TitleModal';

export default function ChannelsList({ visible, onClose, screens, titles }) {
  return (
    <Modal
      transparent={true}
      animationType='slide'
      visible={visible}
      onRequestClose={onClose}
    >
      <View style = {styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TitleModal style={styles.title} title={"CHANNEL LIST"} />
          {screens.map((screen, index) => (
            <Text key={index} style={styles.screenName}>{titles[index]}</Text>
          ))}
          <Button title="Close" backgroundColor="#d9d9d9" color="black" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '30%',
    backgroundColor: '#f4f4f4',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  screenName: {
    fontSize: 16,
    marginVertical: 5,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});