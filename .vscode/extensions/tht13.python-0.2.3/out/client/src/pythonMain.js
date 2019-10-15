'use strict';
var path = require('path');
var vscode_1 = require('vscode');
var vscode_languageclient_1 = require('vscode-languageclient');
var request_1 = require('./request');
function activate(context) {
    console.log("activate");
    let pythonExtension = new PythonExtension(context);
    let disposable = pythonExtension.startServer();
    // Push the disposable to the context's subscriptions so that the 
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);
}
exports.activate = activate;
//TODO: perform autosave setting check, notify user if disabled
class PythonExtension {
    constructor(context) {
        this._context = context;
    }
    _getOptions() {
        // The server is implemented in node
        let serverModule = this._context.asAbsolutePath(path.join('out', 'server', 'src', 'server.js'));
        // The debug options for the server
        let debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
        // If the extension is launch in debug mode the debug server options are use
        // Otherwise the run options are used
        let serverOptions = {
            run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
            debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
        };
        // Options to control the language client
        let clientOptions = {
            // Register the server for python documents
            documentSelector: ['python'],
            synchronize: {
                // Synchronize the setting section 'languageServerExample' to the server
                configurationSection: 'python',
                // Notify the server about file changes to '.pylintrc files contain in the workspace
                fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.pylintrc')
            },
            initializationOptions: {
                debug: true
            }
        };
        return { "serverOptions": serverOptions, "clientOptions": clientOptions };
    }
    _onSave(doc) {
        if (doc.languageId !== 'python') {
            return;
        }
        let params = { processId: process.pid, uri: doc.uri, requestEventType: request_1.RequestEventType.SAVE };
        let cb = (result) => {
            if (!result.succesful) {
                console.error("Lintings failed on save");
                console.error(`File: ${params.uri.toString()}`);
                console.error(`Message: ${result.message}`);
            }
        };
        this._doRequest(params, cb);
    }
    //TODO: need to add check if isDirty, save if it is, check that autosave is enabled
    _onOpen(doc) {
        if (doc.languageId !== 'python') {
            return;
        }
        let params = { processId: process.pid, uri: doc.uri, requestEventType: request_1.RequestEventType.OPEN };
        let cb = (result) => {
            if (!result.succesful) {
                console.error("Lintings failed on open");
                console.error(`File: ${params.uri.toString()}`);
                console.error(`Message: ${result.message}`);
            }
        };
        this._doRequest(params, cb);
    }
    _isControlStatement(line) {
        let text = line.text.substring(line.firstNonWhitespaceCharacterIndex);
        let controlStatementRegExp = new RegExp("^(?:def|class|for|if|elif|else|while).*?:\s*$", "gm");
        return text.search(controlStatementRegExp) !== -1;
    }
    _onChange(e) {
        let doc = e.document;
        let changes = e.contentChanges[0];
        if (doc.languageId !== 'python' ||
            (!changes.text.includes('\n') &&
                !changes.text.includes('\r\n'))) {
            return;
        }
        let range = changes.range;
        // add two lines, one for index from 0, other for new line just inserted
        if (range.end.line + 2 == doc.lineCount)
            return;
        let changeLine = doc.lineAt(range.start.line);
        // if the new Line occured after a ':' then add indentation
        if (this._isControlStatement(changeLine)) {
            if (vscode_1.window.activeTextEditor.document.version !==
                doc.version) {
                return;
            }
            vscode_1.window.activeTextEditor.edit(editBuilder => {
                //TODO: ensure that the indentation has not already been done
                let editorConfig = vscode_1.workspace.getConfiguration("editor");
                let insertSpaces = editorConfig.get("insertSpaces");
                let insertString;
                if (!insertSpaces) {
                    insertString = "\t";
                }
                else {
                    let tabSize = editorConfig.get("tabSize");
                    if (tabSize == "auto" || isNaN(tabSize)) {
                        tabSize = 4;
                    }
                    insertString = " ".repeat(tabSize);
                }
                let currentLineIndent = changeLine.firstNonWhitespaceCharacterIndex;
                let nextLineIndent = doc.lineAt(range.start.line + 1).firstNonWhitespaceCharacterIndex;
                if (currentLineIndent + insertString.length > nextLineIndent) {
                    editBuilder.insert(new vscode_1.Position(range.start.line + 1, 0), insertString);
                }
            });
        }
    }
    _sendConfig() {
        let configuration = vscode_1.workspace.getConfiguration('python');
        let params = {
            processId: process.pid,
            configuration: configuration,
            requestEventType: request_1.RequestEventType.CONFIG
        };
        let cb = (result) => {
            if (!result.succesful) {
                console.error("Error loading configuration");
                console.error(`Message: ${result.message}`);
            }
        };
        this._doRequest(params, cb);
    }
    _doRequest(params, cb) {
        this._languageClient.sendRequest(request_1.Request.type, params).then(cb);
    }
    _registerEvents() {
        // subscribe to trigger when the file is saved or opened
        let subscriptions = [];
        vscode_1.workspace.onDidSaveTextDocument(this._onSave, this, subscriptions);
        vscode_1.workspace.onDidOpenTextDocument(this._onOpen, this, subscriptions);
        vscode_1.workspace.onDidChangeTextDocument(this._onChange, this, subscriptions);
    }
    startServer() {
        let options = this._getOptions();
        // Create the language client and start the client.
        this._languageClient = new vscode_languageclient_1.LanguageClient('Python Language Server', options.serverOptions, options.clientOptions);
        this._registerEvents();
        let start = this._languageClient.start();
        this._onOpen(vscode_1.window.activeTextEditor.document);
        return start;
    }
}
//# sourceMappingURL=pythonMain.js.map