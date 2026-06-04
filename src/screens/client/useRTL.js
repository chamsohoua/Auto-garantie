import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';

/**
 * Custom hook to handle RTL (Right-to-Left) layout
 * Returns isRTL boolean and helper style functions
 */
export const useRTL = () => {
  const { i18n } = useTranslation();
  
  const isRTL = i18n.language === 'ar';
  
  const getTextAlign = () => isRTL ? 'right' : 'left';
  
  const getFlexDirection = (reverse = false) => {
    if (reverse) {
      return isRTL ? 'row' : 'row-reverse';
    }
    return isRTL ? 'row-reverse' : 'row';
  };
  
  const getMargin = (side, value) => {
    if (side === 'left') {
      return isRTL ? { marginRight: value } : { marginLeft: value };
    }
    if (side === 'right') {
      return isRTL ? { marginLeft: value } : { marginRight: value };
    }
    return {};
  };
  
  const getPadding = (side, value) => {
    if (side === 'left') {
      return isRTL ? { paddingRight: value } : { paddingLeft: value };
    }
    if (side === 'right') {
      return isRTL ? { paddingLeft: value } : { paddingRight: value };
    }
    return {};
  };
  
  const getArrowDirection = (direction) => {
    if (direction === 'right') {
      return isRTL ? 'left' : 'right';
    }
    if (direction === 'left') {
      return isRTL ? 'right' : 'left';
    }
    return direction;
  };
  
  return {
    isRTL,
    getTextAlign,
    getFlexDirection,
    getMargin,
    getPadding,
    getArrowDirection,
  };
};