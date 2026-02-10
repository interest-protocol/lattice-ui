export enum RoutesEnum {
  Swap = 'swap',
  Account = 'account',
}

export const Routes: Record<RoutesEnum, string> = {
  [RoutesEnum.Swap]: '/',
  [RoutesEnum.Account]: '/account',
};

export const NAV_ITEMS: ReadonlyArray<RoutesEnum> = [
  RoutesEnum.Swap,
  RoutesEnum.Account,
];

export const NAV_ITEMS_TITLE: Record<RoutesEnum, string> = {
  [RoutesEnum.Swap]: 'Trade',
  [RoutesEnum.Account]: 'Account',
};
