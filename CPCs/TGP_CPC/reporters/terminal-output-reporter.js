const fs = require('fs');
const path = require('path');

/** @implements {import('@playwright/test/reporter').Reporter} */
class TerminalOutputReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile || path.join('test-results', 'terminal-output.log');
    this.suiteLog = [];
  }

  _append(chunk) {
    this.suiteLog.push(chunk.toString());
  }

  onStdOut(chunk) {
    this._append(chunk);
  }

  onStdErr(chunk) {
    this._append(chunk);
  }

  onTestEnd(_test, result) {
    if (!this.suiteLog.length) {
      return;
    }

    const logText = this.suiteLog.join('');
    result.attachments.push({
      name: 'terminal-output',
      contentType: 'text/plain',
      body: Buffer.from(logText),
    });
  }

  onEnd() {
    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
    fs.writeFileSync(this.outputFile, this.suiteLog.join(''), 'utf8');
  }
}

module.exports = TerminalOutputReporter;
