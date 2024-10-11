// import { useState } from 'react';
// import { Modal, View, Text, StyleSheet, Button } from 'react-native';
// import ModalInput from '../inputs/ModalInput';
// // import Button from '../buttons/Button';
// import { useUrls } from '../../context/UrlContext';
// import TitleModal from '../text/TitleModal';

// export default function ChannelsImport({ visible, onClose }) {
//   const [url, setUrl] = useState('');
//   const { addUrl } = useUrls();

//   // Function to handle the "Ok" button
//   const handleOk = () => {
//     addUrl(url);
//     setUrl('');
//     onClose();
//   };

//   return (
//     <Modal
//       animationType="slide"
//       transparent={true}
//       visible={visible}
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalContainer}>
//         <View style={styles.modalContent}>
//           <TitleModal title="IMPORT CHANNELS" />
//           <View style={styles.inputContainer}>
//             <Text style={styles.text}>URL</Text>
//             <ModalInput 
//               value={url} 
//               onChangeText={setUrl} 
//               placeholder={"Paste your channels here"}
//             />
//           </View>
//           <View style={styles.buttonContainer}>
//             <Button title="Ok" color="white" onPress={handleOk} style={styles.buttonOk} />
//             <Button title="Cancel" backgroundColor="#d9d9d9" color="black" onPress={onClose} style={styles.buttonCancel} />
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   modalContent: {
//     width: 400,
//     padding: 20,
//     backgroundColor: '#f4f4f4',
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//   },
//   text: {
//     fontSize: 16,
//     marginRight: 10,
//     marginTop: 8,
//     marginLeft: 0,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '80%',
//   }, 
//   buttonOk: {
//     backgroundColor: '#FF4500',
//   },
//   buttonCancel: {
//     backgroundColor: '#d9d9d9',
//   },
// });
