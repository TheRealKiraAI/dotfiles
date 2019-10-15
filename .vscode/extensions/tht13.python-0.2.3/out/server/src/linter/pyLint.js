"use strict";
var vscode_languageserver_1 = require('vscode-languageserver');
var baseLinter_1 = require('./baseLinter');
class PyLinter extends baseLinter_1.BaseLinter {
    constructor(args) {
        args = args || [];
        let target = "pylint";
        let pylintArgs = ["-r", "n"];
        super(target, args.concat(pylintArgs));
        this.setRegExp("(\\w):([\\s\\d]{3,}),([\\s\\d]{2,}): (.+?) \\((.*)\\)");
        this.buildSeverityMap();
    }
    fixResults(results) {
        // remove lines up to first error message
        for (let i = 0; !results[i++].startsWith('***'); results.shift())
            ;
        results.shift();
        return results;
    }
    /**
     * Diagnostic Severity Map
     */
    buildSeverityMap() {
        super.buildSeverityMap();
        this._severityMap.set('E', vscode_languageserver_1.DiagnosticSeverity.Error);
        this._severityMap.set('F', vscode_languageserver_1.DiagnosticSeverity.Error);
        this._severityMap.set('W', vscode_languageserver_1.DiagnosticSeverity.Warning);
        this._severityMap.set('C', vscode_languageserver_1.DiagnosticSeverity.Information);
        this._severityMap.set('R', vscode_languageserver_1.DiagnosticSeverity.Information);
    }
    parseLintResult(lint) {
        let diagnostic;
        //TODO: vscode node does not yet support destructuring
        // Find out if typescript can specify es5 parts and es6 parts for compile
        // Here and other places
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
                severityKey: match[1],
                line: parseInt(match[2]) - 1,
                column: parseInt(match[3]),
                message: match[4],
                object: match[5]
            };
        }
        let severity = this._severityMap.has(matchProperties.severityKey)
            ? this._severityMap.get(matchProperties.severityKey)
            : vscode_languageserver_1.DiagnosticSeverity.Error;
        let quote = null;
        //TODO: try to implement this better
        // check for variable name or line in message
        if (matchProperties.message.indexOf('"') !== -1) {
            quote = matchProperties.message.match(/\\?"(.*?)\\?"/)[1];
        }
        else if (matchProperties.message.indexOf("'") !== -1) {
            quote = matchProperties.message.match(/'(.*)'/)[1];
        }
        // implement multiLine messages
        // ie lineStart and lineEnd
        let lineNumber = matchProperties.line;
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
            message: matchProperties.message + ': ' + matchProperties.object
        };
        return diagnostic;
    }
}
exports.PyLinter = PyLinter;
//# sourceMappingURL=pyLint.js.map