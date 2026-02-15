declare module '@ika.xyz/sdk' {
  // Re-export types from the ESM build (CJS .d.ts missing in SDK v0.2.7)
  export * from '@ika.xyz/sdk/dist/esm/index';
}
