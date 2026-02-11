export interface TabsProps {
  tab: number;
  tabs: readonly string[];
  setTab: (tab: number) => void;
}
