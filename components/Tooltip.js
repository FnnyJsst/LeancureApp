import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { COLORS } from '../constants/style'; // Vos constantes de couleurs

const Tooltip = () => {
  const [toolTipVisible, setToolTipVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Tooltip
        isVisible={toolTipVisible}
        content={
          <Text style={styles.tooltipText}>
            Cette action permet de changer l'adresse du serveur
          </Text>
        }
        placement="top"
        onClose={() => setToolTipVisible(false)}
        // Style personnalisé pour correspondre à votre thème
        backgroundColor={COLORS.gray850}
        tooltipStyle={styles.tooltip}
      >
        <TouchableOpacity
          onPress={() => setToolTipVisible(true)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Changer serveur</Text>
        </TouchableOpacity>
      </Tooltip>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: COLORS.orange,
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.white,
  },
  tooltip: {
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  tooltipText: {
    color: COLORS.white,
    fontSize: 14,
    padding: 5,
  },
});

export default Tooltip;