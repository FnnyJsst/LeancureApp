import { Modal, View, StyleSheet } from 'react-native';
import ModalInput from '../inputs/ModalInput';
import Button from '../buttons/Button';
import TitleModal from '../text/TitleModal';

export default function PasswordModal({ visible, onClose }) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TitleModal title="ENTER PASSWORD" />
            <View style={styles.inputContainer}>
              <ModalInput placeholder="Password" secureTextEntry={true} style={styles.input} />
              <ModalInput placeholder="Re-enter password" secureTextEntry={true} style={styles.input} />
            </View>
            <View style={styles.buttonContainer}>
              {/* <Button title="Do not use password" backgroundColor="#d9d9d9" color="black" onPress={onClose} width="50%" style={styles.buttonPassword}/> */}
              <Button title="Ok" backgroundColor="#FF4500" color="white"onPress={onClose} width="30%" style={styles.button}/>
              <Button title="Close" backgroundColor="#d9d9d9" color="black" onPress={onClose} width="30%" style={styles.button}/>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 400,
    padding: 20,
    backgroundColor: '#f4f4f4',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'column', 
    width: '100%', 
    marginTop: 15,
  },
  input: {
    width: '100%',
  },
  text: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 8,
    marginLeft: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});