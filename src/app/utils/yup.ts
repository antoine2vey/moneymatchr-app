import * as Yup from 'yup';

declare module 'yup' {
  export interface StringSchema {
    ethereum(): StringSchema;
  }
}

function isAddress(address: string) {
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false;
  } else {
    if (/^(0x|0X)?[0-9a-f]{40}$/.test(address) || /^(0x|0X)?[0-9A-F]{40}$/.test(address)) {
      return true;
    }
  }
}

function parseEthereumAddress(this: any) {
  return this.test(
    'ethereum',
    ({ value }: { value: string }) => `${value} is not a valid Ethereum address`,
    function (value: string) {
      return isAddress(value.toLowerCase());
    }
  );
}

Yup.addMethod(Yup.string, 'ethereum', parseEthereumAddress);
