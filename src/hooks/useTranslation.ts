import { useTranslation as useTranslationOriginal } from 'react-i18next';

/**
 * Custom hook for typed translations
 * Usage:
 *   const { t } = useTranslation();
 *   t('common.search')
 *   t('favorites.count', { count: 5 })
 */
export const useTranslation = () => {
  return useTranslationOriginal();
};

export default useTranslation;
