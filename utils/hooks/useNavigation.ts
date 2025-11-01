import { useRouter } from 'next/navigation';

/**
 * Generic navigation hook for view mode switching and routing
 * Can be extended for specific features (calendar, planner, etc.)
 */
export const useNavigation = <T extends string>(config: {
  basePath: string;
  viewModeMap: Record<T, string>;
  formatDate: (date: Date) => string;
}) => {
  const router = useRouter();
  const { basePath, viewModeMap, formatDate } = config;

  /**
   * Navigate to a specific date with a specific view mode
   * @param date - The date to navigate to
   * @param viewMode - The view mode to switch to
   */
  const navigateToDate = (date: Date, viewMode: T) => {
    const dateStr = formatDate(date);
    const urlView = viewModeMap[viewMode];
    router.push(`${basePath}/${urlView}/${dateStr}`, { scroll: false });
  };

  return {
    navigateToDate,
  };
};
