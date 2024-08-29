import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Feather, Entypo } from '@expo/vector-icons';

// Header is a component that displays the header of the drawer
export default function Header({ title, onBackPress, onImportPress, onAddPress, showIcons }) {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onBackPress}>
        <Ionicons name="arrow-back" size={20} style={styles.leftArrowIcon} />
      </TouchableOpacity>
      <Text style={styles.headerText}>{title}</Text>
      {showIcons && (
        <>
          <TouchableOpacity onPress={onImportPress}>
            <Feather name="download" size={20} style={styles.icon} />
          </TouchableOpacity>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={onAddPress}>
              <Entypo name="add-to-list" size={20} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 75,
    marginVertical: 25,
    marginHorizontal: 25,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23262f',
    borderRadius: 5,
  },
  leftArrowIcon: {
    marginLeft: 10,
    color: '#fff',
  },
  headerText: {
    fontSize: 20,
    marginLeft: 15,
    fontFamily: 'Montserrat',
    color: "#fff",
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    marginRight: 25,
  },
  icon: {
    marginLeft: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});