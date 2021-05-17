export const abbreviateAddress = (address: string): string => {
  return address.slice(0, 4) + '…' + address.slice(address.length - 4);
};

export const getUiAmount = (amount: number, decimals: number): number => {
  return amount / 10 ** decimals;
};
