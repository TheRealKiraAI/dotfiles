"use strict";
var utils_1 = require('./../utils');
//TODO: Handle false return from validatePath better
class BaseLinter {
    constructor(target, args) {
        this._consoleEnabled = false;
        args = args || [];
        this._target = target;
        this._args = args;
        this.buildSeverityMap();
    }
    ;
    /**
     * Get the command line string to run for the file
     * @returns string
     */
    getCmd() {
        if (utils_1.validatePath(this._filepath)) {
            //TODO: destructuring not allowed yet e.g. ...this.args
            let cmd = [].concat([this._target], this._args, [this._filepath]);
            return cmd.join(" ");
        }
        else {
            this.error(`Error generating command`);
            this.error(`File does not exist: ${this._filepath}`);
        }
    }
    /**
     * Get the target linter to execute
     * @returns string
     */
    getTarget() {
        return this._target;
    }
    /**
     * Set the command line target for the linter
     * Used when a linter is in a custom location
     * @param  {string} target The target of the linter
     */
    setTarget(target) {
        if (utils_1.validatePath(target)) {
            this._target = target;
        }
        else {
            this.error(`Error setting target`);
            this.error(`Target does not exist: ${target}`);
        }
    }
    getRegExp() {
        return this._regExp;
    }
    /**
     * Set the RegExp to use to parse lint results
     * @throws {EvalError} Thrown when the input pattern is invalid
     * @param  {string} pattern The regular expression patter
     * @param  {string=""} flags A string of character flags (igm) to use in the RegExp, Defaults to none
     */
    setRegExp(pattern, flags) {
        flags = flags || "";
        try {
            let regExp = new RegExp(pattern, flags);
            this._regExp = regExp;
        }
        catch (e) {
            this.warn(e.toString());
            throw new EvalError();
        }
    }
    setDocument(doc) {
        let path = utils_1.fixPath(doc.uri);
        if (utils_1.validatePath(path)) {
            this._filepath = path;
            this._documentText = doc.getText().split(/\r?\n/g);
            this.log(`Loaded document: ${this._filepath}`);
        }
        else {
            this.error(`Error loading document`);
            this.error(`File does not exist: ${path}`);
        }
    }
    getFilepath() {
        return this._filepath;
    }
    fixResults(results) {
        return results;
    }
    /**
     * Parses a linting result and returns the Diagnostic result
     * @param  {string} line The line from command line to parse
     * @returns Diagnostic
     */
    parseLintResult(line) {
        let dummyDiagnostic = {
            message: "Dummy diagnostic",
            range: this.createRange(0, 0, 0, 1)
        };
        return dummyDiagnostic;
    }
    /**
     * Creates a Range from the input line and character positions
     * @param  {number} startLine The starting line
     * @param  {number} startChar The starting character
     * @param  {number} endLine The ending line
     * @param  {number} endChar The ending character
     * @returns Range
     */
    createRange(startLine, startChar, endLine, endChar) {
        return {
            start: {
                line: startLine,
                character: startChar
            },
            end: {
                line: endLine,
                character: endChar
            }
        };
    }
    buildSeverityMap() {
        this._severityMap = new Map();
    }
    /**
     * Enable verbose output to the console from the linter
     * @param  {RemoteConsole} console The console to write to, i.e connection.console
     */
    enableConsole(console) {
        this._consoleEnabled = true;
        this._console = console;
    }
    /**
     * Show an error message.
     *
     * @param message The message to show.
     */
    error(message) {
        if (this._consoleEnabled)
            this._console.error(message);
    }
    /**
     * Show a warning message.
     *
     * @param message The message to show.
     */
    warn(message) {
        if (this._consoleEnabled)
            this._console.warn(message);
    }
    /**
     * Show an information message.
     *
     * @param message The message to show.
     */
    info(message) {
        if (this._consoleEnabled)
            this._console.info(message);
    }
    /**
     * Log a message.
     *
     * @param message The message to log.
     */
    log(message) {
        if (this._consoleEnabled)
            this._console.log(message);
    }
}
exports.BaseLinter = BaseLinter;
//# sourceMappingURL=baseLinter.js.map