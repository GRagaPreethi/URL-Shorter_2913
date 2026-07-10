declare module "ua-parser-js" {
  export interface IResult {
    browser: { name?: string; version?: string };
    os: { name?: string; version?: string };
    device: { type?: string; vendor?: string; model?: string };
  }

  export class UAParser {
    constructor(uaString?: string);
    getResult(): IResult;
  }
}
