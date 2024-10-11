// import { useState } from 'react';
// import { StyleSheet, ActivityIndicator } from 'react-native';
// import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
// import ChannelsImport from '../modals/ChannelsImport';
// import ImportChannelDialog from '../modals/ImportChannelDialog';
// import Header from '../Header'; 
// import NewChannelsList from '../modals/NewChannelsList';

// export default function DrawerContent(props) {
//   const [isImportModalVisible, setImportModalVisible] = useState(false);
//   const [dialogVisible, setDialogVisible] = useState(false);

//   // Functions to open and close both modal windows for importing and adding channels
//   const openImportModal = () => {
//     setImportModalVisible(true);
//   };
//   const closeImportModal = () => {
//     setImportModalVisible(false);
//   };

//   const openDialog = () => {
//     setDialogVisible(true);
//   };
//   const closeDialog = () => {
//     setDialogVisible(false);
//   };

//   // If the fonts are not loaded, show an activity indicator
//   if (!fontsLoaded) {
//     return <ActivityIndicator size="small" color="#ff4500" />; 
//   }

//   return (
//     <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
//       <Header 
//         title="CHANNELS MANAGEMENT" 
//         onBackPress={() => props.navigation.closeDrawer()} 
//         onImportPress={openImportModal} 
//         onDialogPress={openDialog}
//         showIcons={true} 
//       />
//       <DrawerItemList {...props} />
//       <ChannelsImport visible={isImportModalVisible} onClose={closeImportModal} />
//       <ImportChannelDialog visible={dialogVisible} onClose={() => setDialogVisible(false)} />
//     </DrawerContentScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   drawerContent: {
//     paddingTop: 25,
//   },
// });