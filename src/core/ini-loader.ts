import * as fs from "fs";
import * as path from "path";

type DicKeyList = Record<string, string>;
type DicTitleList = Record<string, DicKeyList>;

class INILoader {
  private fileName: string = "";
  private currentTitle: string = "";
  private titleList: DicTitleList = {};
  private saveLog: boolean = false;
  private logStream: fs.WriteStream | null = null;

  constructor(fileName: string = "", saveLog: boolean = false) {
    if (fileName && fs.existsSync(fileName)) {
      this.saveLog = saveLog;
      if (this.saveLog) {
        const logDir = path.join(__dirname, "../../log");
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }

        const logFileName = path.basename(fileName) + ".log";
        const logFilePath = path.join(logDir, logFileName);

        this.logStream = fs.createWriteStream(logFilePath, {
          flags: "w",
          encoding: "utf8",
        });
      }

      this.fileName = fileName;
      this.currentTitle = "";
      this.parseFile();
    }
  }

  setFileName(fileName: string): void {
    this.titleList = {};
    this.fileName = fileName;
    this.currentTitle = "";

    if (fs.existsSync(fileName)) {
      this.parseFile();
    } else {
      this.writeLog(`INI file does not exist: [${fileName}]`);
    }
  }

  getFileName(): string {
    return this.fileName;
  }

  private parseFile(): void {
    this.writeLog(
      `<<< -------------------- ${this.fileName} Load -------------------- >>>`
    );

    const lines = fs.readFileSync(this.fileName, "utf8").split(/\r?\n/);
    let currentKeyList: DicKeyList = {};
    let lastLine: string = "";

    for (const line of lines) {
      const cleanLine = line.trim().replace("\t", "");
      if (!cleanLine) continue;

      if (cleanLine.startsWith("[")) {
        if (Object.keys(currentKeyList).length > 0) {
          this.addToTitleList(lastLine, currentKeyList);
          currentKeyList = {};
        }
        lastLine = cleanLine;
      } else if (!cleanLine.startsWith(";")) {
        this.parseKey(lastLine, cleanLine, currentKeyList);
      }
    }

    if (Object.keys(currentKeyList).length > 0) {
      this.addToTitleList(lastLine, currentKeyList);
    }

    this.writeLog(
      `<<< -------------------- ${this.fileName} Load Complete -------------------- >>>`
    );
    this.closeLog();
  }

  private parseKey(title: string, line: string, keyList: DicKeyList): void {
    const [key, value] = line.split("=", 2).map((s) => s.trim());
    if (key && value) {
      if (keyList[key]) {
        this.writeLog(`Duplicate key found: ${title} - ${key}`);
      } else {
        keyList[key] = value;
      }
    }
  }

  private addToTitleList(title: string, keyList: DicKeyList): void {
    const match = title.match(/\[(.+?)\]/);
    if (match) {
      const titleName = match[1];
      if (this.titleList[titleName]) {
        this.writeLog(`Duplicate section found: ${title}`);
      } else {
        this.titleList[titleName] = keyList;
      }
    } else {
      this.writeLog(`Unknown error with title: ${title}`);
    }
  }

  setTitle(section: string): void {
    this.currentTitle = section;
  }

  writeValue(key: string, value: string): void {
    if (!this.fileName || !this.currentTitle) return;

    const content = `${key}=${value}\n`;
    fs.appendFileSync(this.fileName, content, "utf8");
  }

  getValue(key: string): string {
    if (!this.currentTitle) return "";

    const section = this.titleList[this.currentTitle];
    if (section && section[key]) {
      return section[key];
    }
    return "";
  }

  loadString(key: string, defaultValue: string): string {
    const value = this.getValue(key);
    return value || defaultValue;
  }

  loadInt(key: string, defaultValue: number): number {
    const value = this.getValue(key);
    return value ? parseInt(value, 10) : defaultValue;
  }

  loadFloat(key: string, defaultValue: number): number {
    const value = this.getValue(key);
    return value ? parseFloat(value) : defaultValue;
  }

  loadBool(key: string, defaultValue: boolean): boolean {
    const value = this.getValue(key);
    return value ? value === "1" : defaultValue;
  }

  private writeLog(log: string): void {
    if (this.saveLog && this.logStream) {
      this.logStream.write(`${log}\n`);
    }
  }

  private closeLog(): void {
    if (this.saveLog && this.logStream) {
      this.logStream.end();
    }
  }
}

export default INILoader;
