declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(location: string, options?: Record<string, unknown>);
    exec(sql: string): void;
    prepare(sql: string): {
      run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
      get(...params: any[]): unknown;
      all(...params: any[]): unknown[];
    };
    close(): void;
  }
}
