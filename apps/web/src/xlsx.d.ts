declare module "xlsx" {
  export function read(data: ArrayBuffer | Uint8Array, opts?: any): any;
  export const utils: {
    sheet_to_json(sheet: any, opts?: any): any[];
  };
}
