import React from 'react';
import { View, Text } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Ici vous pouvez logger l'erreur vers un service
    console.log('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View testID="error-boundary-fallback">
          <Text>Something went wrong</Text>
          <Text>{this.state.error?.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;