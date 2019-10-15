"use strict";
var vscode_languageserver_1 = require('vscode-languageserver');
var baseLinter_1 = require('./baseLinter');
class Flake8 extends baseLinter_1.BaseLinter {
    constructor(args) {
        args = args || [];
        let target = "flake8";
        let pylintArgs = [];
        super(target, args.concat(pylintArgs));
        this.setRegExp("(.*?):(\\d*):(\\d*): (\\w\\d*) (.*)$");
        this.buildSeverityMap();
    }
    /**
     * Diagnostic Severity Map
     */
    buildSeverityMap() {
        super.buildSeverityMap();
        this._severityMap.set('E', vscode_languageserver_1.DiagnosticSeverity.Error);
        this._severityMap.set('F', vscode_languageserver_1.DiagnosticSeverity.Error);
        this._severityMap.set('W', vscode_languageserver_1.DiagnosticSeverity.Warning);
    }
    parseLintResult(lint) {
        let diagnostic;
        let matchProperties;
        // destructuring not yet supported in vscode
        // must be done manually
        {
            //TODO: parse null better
            let match = lint.match(this.getRegExp());
            if (match == null) {
                this.warn("unparsed line:");
                this.warn(lint);
                return;
            }
            matchProperties = {
                completeMatch: match[0],
                filepath: match[1],
                line: parseInt(match[2]) - 1,
                column: parseInt(match[3]) - 1,
                severityKey: match[4],
                message: match[5]
            };
        }
        let severity = this._severityMap.has(matchProperties.severityKey.substring(0, 1))
            ? this._severityMap.get(matchProperties.severityKey.substring(0, 1))
            : vscode_languageserver_1.DiagnosticSeverity.Error;
        let quote = null;
        // check for variable name or line in message
        if (matchProperties.message.indexOf('"') !== -1) {
            quote = matchProperties.message.match(/\\?"(.*?)\\?"/)[1];
        }
        else if (matchProperties.message.indexOf("'") !== -1) {
            quote = matchProperties.message.match(/'(.*)'/)[1];
        }
        // implement multiLine messages
        // ie lineStart and lineEnd
        let lineNumber = matchProperties.line - 1;
        let colStart = matchProperties.column;
        let colEnd = this._documentText[lineNumber].length;
        let documentLine = this._documentText[lineNumber];
        if (quote !== null) {
            let quoteRe = new RegExp("\\W" + quote + "\\W");
            let quoteStart = documentLine.search(quoteRe) + 1;
            if (quoteStart === -1) {
                this.warn("Colstart could not be identified.");
            }
            else {
                colStart = quoteStart;
                colEnd = colStart + quote.length;
            }
        }
        // make sure colStart does not including leading whitespace
        if (colStart == 0 && documentLine.substr(0, 1).match(/\s/) !== null) {
            colStart = documentLine.length - documentLine.replace(/^\s*/g, "").length;
        }
        this.log(`${JSON.stringify(matchProperties.completeMatch)}`);
        diagnostic = {
            severity: severity,
            range: this.createRange(lineNumber, colStart, lineNumber, colEnd),
            message: matchProperties.severityKey + ": " + matchProperties.message
        };
        return diagnostic;
    }
}
exports.Flake8 = Flake8;
//# sourceMappingURL=flake8.js.map