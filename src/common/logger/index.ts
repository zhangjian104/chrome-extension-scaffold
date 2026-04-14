export class Logger {
  private prefix = '[WxtApp]';

  constructor(private context: string) {}

  info(...args: any[]) {
    console.log(`${this.prefix}[${this.context}]`, ...args);
  }

  warn(...args: any[]) {
    console.warn(`${this.prefix}[${this.context}]`, ...args);
  }

  error(...args: any[]) {
    console.error(`${this.prefix}[${this.context}]`, ...args);
  }
}
