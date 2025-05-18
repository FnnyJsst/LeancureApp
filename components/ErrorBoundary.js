import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './text/CustomText';
import { useTranslation } from 'react-i18next';
import { COLORS, SIZES } from '../constants/style';

/**
 * @component ErrorBoundaryFallback
 * @description Component that displays a fallback UI when an error occurs
 */
const ErrorBoundaryFallback = ({ error, resetError }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID="error-boundary-fallback">
      <View style={styles.content}>
        <Text style={styles.title}>{t('errors.boundary.title')}</Text>
        <Text style={styles.message}>{t('errors.boundary.message')}</Text>
        {error?.message && (
          <Text style={styles.details}>{error.message}</Text>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={resetError}
          testID="error-boundary-reset"
        >
          <Text style={styles.buttonText}>
            {t('errors.boundary.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * @class ErrorBoundary
 * @description Component that captures errors in its children
 * and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // We use our centralized error management system
    console.error('[ErrorBoundary] Error:', error);

    this.setState({
      errorInfo: errorInfo
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray950,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center'
  },
  title: {
    fontSize: SIZES.fonts.titleTablet,
    color: COLORS.red,
    marginBottom: 20,
    textAlign: 'center'
  },
  message: {
    fontSize: SIZES.fonts.bodyTablet,
    color: COLORS.gray300,
    marginBottom: 15,
    textAlign: 'center'
  },
  details: {
    fontSize: SIZES.fonts.smallTablet,
    color: COLORS.gray500,
    marginBottom: 30,
    textAlign: 'center'
  },
  button: {
    backgroundColor: COLORS.blue500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.buttonTablet
  }
});

export default ErrorBoundary;