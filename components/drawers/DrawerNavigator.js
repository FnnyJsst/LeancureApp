// import { useState } from 'react';
// import { createDrawerNavigator } from '@react-navigation/drawer';
// import DrawerContent from './DrawerContent';
// import { useUrls } from '../../context/UrlContext';
// import WebViewScreen from '../../screens/WebViewScreen'; 
// import NoChannelScreen from '../../screens/NoChannelScreen';
// import ChannelsListScreen from '../../screens/ChannelsListScreen'; // Importation de ChannelsListScreen
// import DrawerLabel from './DrawerLabel'; 
// import EditChannel from '../modals/EditChannel';

// const Drawer = createDrawerNavigator();

// // Cette fonction est utilisée pour obtenir les écrans à afficher dans le tiroir
// export const getDrawerScreens = (urls, titles, onMoveUp, onMoveDown, onEdit, onDelete) => {
//   if (urls.length > 0) {
//     return urls.map((url, index) => ({
//       name: `WebView ${index + 1}`,
//       component: WebViewScreen,
//       initialParams: { 
//         url, 
//         index
//       },
//       options: {
//         drawerLabel: ({ color, size }) => (
//           <DrawerLabel 
//             label={titles[index] || `WebView ${index + 1}`} 
//             iconColor={color} 
//             iconSize={size} 
//             onMoveUp={() => onMoveUp(index)}
//             onMoveDown={() => onMoveDown(index)}
//             onEdit={() => onEdit(index)}
//             onDelete={() => onDelete(index)}
//           />
//         ),
//       },
//     }));
//   } else {
//     return [{
//       name: "No Channel",
//       component: NoChannelScreen,
//       options: {
//         drawerLabel: ({ color, size }) => (
//           <DrawerLabel 
//             label="No Channel" 
//             iconName="exclamationcircleo" 
//             iconColor={color} 
//             iconSize={size} 
//           />
//         ),
//       },
//     }];
//   }
// };

// // Cette fonction est utilisée pour gérer le tiroir
// export default function DrawerNavigator() {
//   const { urls, titles, updateUrl, updateTitle } = useUrls();
//   const [screensOrder, setScreensOrder] = useState(urls);
//   const [isEditModalVisible, setEditModalVisible] = useState(false);
//   const [currentEditIndex, setCurrentEditIndex] = useState(null);

//   const handleMoveUp = (index) => {
//     if (index > 0) {
//       const newOrder = [...screensOrder];
//       const [movedScreen] = newOrder.splice(index, 1);
//       newOrder.splice(index - 1, 0, movedScreen);
//       setScreensOrder(newOrder);

//       const newUrls = [...urls];
//       const [movedUrl] = newUrls.splice(index, 1);
//       newUrls.splice(index - 1, 0, movedUrl);
//       updateUrl(newUrls);

//       const newTitles = [...titles];
//       const [movedTitle] = newTitles.splice(index, 1);
//       newTitles.splice(index - 1, 0, movedTitle);
//       updateTitle(newTitles);
//     }
//   };

//   const handleMoveDown = (index) => {
//     if (index < screensOrder.length - 1) {
//       const newOrder = [...screensOrder];
//       const [movedScreen] = newOrder.splice(index, 1);
//       newOrder.splice(index + 1, 0, movedScreen);
//       setScreensOrder(newOrder);

//       const newUrls = [...urls];
//       const [movedUrl] = newUrls.splice(index, 1);
//       newUrls.splice(index + 1, 0, movedUrl);
//       updateUrl(newUrls);

//       const newTitles = [...titles];
//       const [movedTitle] = newTitles.splice(index, 1);
//       newTitles.splice(index + 1, 0, movedTitle);
//       updateTitle(newTitles);
//     }
//   };

//   const handleEdit = (index) => {
//     setCurrentEditIndex(index);
//     setEditModalVisible(true);
//   };

//   const handleEditSave = (newUrl, newTitle) => {
//     const newOrder = [...screensOrder];
//     newOrder[currentEditIndex] = newUrl;
//     setScreensOrder(newOrder);
//     updateUrl(currentEditIndex, newUrl); 
//     updateTitle(currentEditIndex, newTitle);
//     setEditModalVisible(false);
//   };

//   const handleDelete = (index) => {
//     const newOrder = screensOrder.filter((_, i) => i !== index);
//     setScreensOrder(newOrder);
//     updateUrl(index, null);
//   };

//   const screens = getDrawerScreens(urls, titles, handleMoveUp, handleMoveDown, handleEdit, handleDelete);

//   return (
//     <>
//       <Drawer.Navigator 
//         drawerContent={(props) => <DrawerContent {...props} />}
//         screenOptions={{
//           drawerStyle: {
//             backgroundColor: '#ffff',
//             width: '100%',
//             borderRadius: 10,
//           },
//           drawerPosition: 'right',
//           drawerActiveTintColor: '#92969d',
//           drawerActiveBackgroundColor: '#f4f4f4', 
//           drawerLabelStyle: {},
//           drawerItemStyle: {
//             marginHorizontal: 40,
//           },
//         }}
//         initialRouteName="Home"
//       >
//         {screens.map((screen, index) => (
//           <Drawer.Screen 
//             key={index}
//             name={screen.name}
//             component={screen.component}
//             initialParams={screen.initialParams}
//             options={screen.options}
//           />
//         ))}
//         <Drawer.Screen 
//           name="ChannelsListScreen" 
//           component={ChannelsListScreen} 
//           options={{
//             drawerLabel: "Channels List",
//           }}
//         />
//       </Drawer.Navigator>
//       <EditChannel 
//         visible={isEditModalVisible} 
//         onClose={() => setEditModalVisible(false)} 
//         onSave={handleEditSave} 
//         initialUrl={screensOrder[currentEditIndex]}
//         initialTitle={titles[currentEditIndex]}
//       />
//     </>
//   );
// }