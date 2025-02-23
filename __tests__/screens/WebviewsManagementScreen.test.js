import { render, screen } from '@testing-library/react-native';
import WebviewsManagementScreen from '../../screens/webviews/WebviewsManagementScreen';

describe('WebviewsManagementScreen', () => {
  it('should render correctly', () => {
    render(<WebviewsManagementScreen />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
