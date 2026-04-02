import { useWindowDimensions } from 'react-native'

export function useLayout() {
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  return { isDesktop, width }
}
