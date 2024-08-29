import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

// DrawerLabel is a component that displays the label of the channel in the drawer
const DrawerLabel = ({ label, iconName, iconColor, iconSize, onMoveUp, onMoveDown, onEdit, onDelete }) => {
  const [upColor, setUpColor] = useState('black');
  const [downColor, setDownColor] = useState('black');
  const [pencilColor, setPencilColor] = useState('black');
  const [binColor, setBinColor] = useState('black');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {/* If there is one or more channels, we show some icons to move, edit and delete the channel */}
      {label !== "No Channel" && (
        <>
          <View style={styles.arrowContainer}>
            <TouchableOpacity 
              onPress={onMoveUp}
              onPressIn={() => setUpColor('#ff4500')}
              onPressOut={() => setUpColor('black')}
            >
              <AntDesign name="up" size={30} color={upColor} style={styles.up} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onMoveDown}
              onPressIn={() => setDownColor('#ff4500')}
              onPressOut={() => setDownColor('black')}
            >
              <AntDesign name="down" size={30} color={downColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.iconsContainer}>
            <TouchableOpacity 
              onPress={onEdit}
              onPressIn={() => setPencilColor('#ff4500')}
              onPressOut={() => setPencilColor('black')}
            >
              <EvilIcons name="pencil" size={40} color={pencilColor} style={styles.pencil}/>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onDelete}
              onPressIn={() => setBinColor('#ff4500')}
              onPressOut={() => setBinColor('black')}
            >
              <Ionicons name="trash-outline" size={30} color={binColor} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  label: {
    marginLeft: 15, 
    color: 'black',
    fontSize: 20,
  },
  arrowContainer: {
    flexDirection: 'row',
    marginLeft: 'auto',
    marginRight: 30,
  },
  up: {
    marginRight: 25,
  },
  iconsContainer: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  pencil: {
    marginRight: 10,
  },
});

export default DrawerLabel;