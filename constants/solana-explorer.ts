export enum SolanaExplorer {
  Solscan = 'solscan',
  SolanaFM = 'solana-fm',
  SolanaExplorer = 'solana-explorer',
}

export enum SolanaExplorerMode {
  Account = 0,
  Transaction = 1,
  Token = 2,
}

export const SOLANA_EXPLORERS = [
  SolanaExplorer.Solscan,
  SolanaExplorer.SolanaFM,
  SolanaExplorer.SolanaExplorer,
];

export const SOLANA_EXPLORER_DISPLAY = {
  [SolanaExplorer.Solscan]: 'Solscan',
  [SolanaExplorer.SolanaFM]: 'Solana FM',
  [SolanaExplorer.SolanaExplorer]: 'Solana Explorer',
};

export const SOLANA_EXPLORER_URL_GETTER: Record<
  SolanaExplorer,
  (path: string) => string
> = {
  [SolanaExplorer.Solscan]: (path: string) => `https://solscan.io/${path}`,
  [SolanaExplorer.SolanaFM]: (path: string) => `https://solana.fm/${path}`,
  [SolanaExplorer.SolanaExplorer]: (path: string) =>
    `https://explorer.solana.com/${path}`,
};

export const SOLANA_EXPLORER_PATH_GETTER = {
  [SolanaExplorer.Solscan]: {
    [SolanaExplorerMode.Account]: (value: string) => `account/${value}`,
    [SolanaExplorerMode.Transaction]: (value: string) => `tx/${value}`,
    [SolanaExplorerMode.Token]: (value: string) => `token/${value}`,
  },
  [SolanaExplorer.SolanaFM]: {
    [SolanaExplorerMode.Account]: (value: string) => `address/${value}`,
    [SolanaExplorerMode.Transaction]: (value: string) => `tx/${value}`,
    [SolanaExplorerMode.Token]: (value: string) => `address/${value}`,
  },
  [SolanaExplorer.SolanaExplorer]: {
    [SolanaExplorerMode.Account]: (value: string) => `address/${value}`,
    [SolanaExplorerMode.Transaction]: (value: string) => `tx/${value}`,
    [SolanaExplorerMode.Token]: (value: string) => `address/${value}`,
  },
} as Record<
  SolanaExplorer,
  Record<SolanaExplorerMode, (path: string) => string>
>;
