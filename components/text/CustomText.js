import { Text as RNText } from 'react-native';
import { FONTS } from '../../constants/style';

export const Text = (props) => {
  return (
    <RNText 
      {...props} 
      style={[
        { fontFamily: FONTS.regular },
        props.style
      ]}
    >
      {props.children}
    </RNText>
  );
}; 