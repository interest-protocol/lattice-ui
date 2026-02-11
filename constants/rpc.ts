export enum RPC {
  Shinami = 'shinami',
  Mysten = 'mysten',
  Blockvision = 'blockvision',
  SuiScan = 'suiscan',
  Suiet = 'suiet',
}

export const RPCs = [
  RPC.Shinami,
  RPC.Mysten,
  RPC.Blockvision,
  RPC.SuiScan,
  RPC.Suiet,
];

export const RPC_DISPLAY = {
  [RPC.Shinami]: 'Shinami',
  [RPC.Mysten]: 'Mysten Public RPC',
  [RPC.Blockvision]: 'Blockvision',
  [RPC.SuiScan]: 'SuiScan',
  [RPC.Suiet]: 'Suiet',
};

export const RPC_MAP: Record<RPC, string> = {
  [RPC.Shinami]:
    process.env.NEXT_PUBLIC_SHINAMI_RPC_URL ||
    'https://api.shinami.com/node/v1/sui_mainnet',
  [RPC.Mysten]: 'https://fullnode.mainnet.sui.io:443',
  [RPC.Blockvision]: 'https://sui-mainnet-endpoint.blockvision.org',
  [RPC.SuiScan]: 'https://rpc-mainnet.suiscan.xyz',
  [RPC.Suiet]: 'https://mainnet.suiet.app',
};
