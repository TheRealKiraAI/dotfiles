'use strict';
var vscode_languageserver_1 = require('vscode-languageserver');
var child_process_1 = require('child_process');
require('process');
var request_1 = require('../../client/src/request');
var pyLint_1 = require('./linter/pyLint');
var flake8_1 = require('./linter/flake8');
var LinterType;
(function (LinterType) {
    LinterType[LinterType["FLAKE8"] = 0] = "FLAKE8";
    LinterType[LinterType["PYLINTER"] = 1] = "PYLINTER";
})(LinterType || (LinterType = {}));
const DEFAULT_LINTER = "pyLint";
// Create a connection for the server. The connection uses 
// stdin / stdout for message passing
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
// Create a simple text document manager. The text document manager
// supports full document sync only
let documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// hold the maxNumberOfProblems setting
let maxNumberOfProblems;
let linterMap = new Map();
linterMap.set(DEFAULT_LINTER, LinterType.PYLINTER);
linterMap.set("pyLint", LinterType.PYLINTER);
linterMap.set("flake8", LinterType.FLAKE8);
// hold linter type
let linterType = getLinterType(DEFAULT_LINTER);
// Linter
let linter;
// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites. 
let workspaceRoot;
connection.onInitialize((params) => {
    // connection.console.log(params.initializationOptions);
    workspaceRoot = params.rootPath;
    linter = loadLinter(linterType);
    // linter.enableConsole(connection.console);
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind
        }
    };
});
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
    let settings = change.settings;
    loadSettings(settings.python);
    // Revalidate any open text documents
    documents.all().forEach(validateTextDocument);
});
function loadSettings(pythonSettings) {
    maxNumberOfProblems = pythonSettings.maxNumberOfProblems || 100;
    linterType = getLinterType(pythonSettings.linter || DEFAULT_LINTER);
    linter = loadLinter(linterType);
    // connection.console.log("setings");
    // connection.console.log(maxNumberOfProblems.toString());
    // connection.console.log(pythonSettings.linter);
}
/**
 * Handles requests from the client
 * Returns the status of the handle attempt
 */
connection.onRequest(request_1.Request.type, (params) => {
    // connection.console.log("REQUEST");
    // connection.console.log("REQUEST EVENT TYPE: " + params.requestEventType);
    let result;
    switch (params.requestEventType) {
        case request_1.RequestEventType.OPEN:
        case request_1.RequestEventType.SAVE:
            try {
                validateTextDocument(documents.get(params.uri.toString()));
                result = {
                    succesful: true
                };
            }
            catch (exception) {
                result = {
                    succesful: false,
                    message: exception.toString()
                };
            }
            break;
        case request_1.RequestEventType.CONFIG:
            loadSettings(params.configuration);
            break;
    }
    return result;
});
/**
 * Takes a text document and runs PyLint on it, sends Diagnostics back to client
 * @param  {ITextDocument} textDocument
 */
function validateTextDocument(textDocument) {
    linter.setDocument(textDocument);
    let cmd = linter.getCmd();
    child_process_1.exec(cmd, function (error, stdout, stderr) {
        if (error.toString().length !== 0) {
            connection.console.warn(`[ERROR] File: ${linter.getFilepath()} - Error message: ${error.toString()}`);
            connection.console.warn(`[ERROR] Error output: ${stderr.toString()}`);
        }
        let results = stdout.toString().split(/\r?\n/g);
        results = linter.fixResults(results);
        // process linter output
        let diagnostics = [];
        for (let result of results) {
            if (diagnostics.length >= maxNumberOfProblems) {
                break;
            }
            let diagnostic = linter.parseLintResult(result);
            if (diagnostic != null) {
                diagnostics.push(diagnostic);
            }
        }
        connection.console.log(`File: ${linter.getFilepath()} - Errors Found: ${diagnostics.length.toString()}`);
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    });
}
connection.onDidChangeWatchedFiles((change) => {
    // Monitored files have change in VSCode
    connection.console.log('We recevied an file change event');
    documents.all().forEach(validateTextDocument);
});
function loadLinter(type) {
    switch (type) {
        case LinterType.FLAKE8:
            return new flake8_1.Flake8();
        case LinterType.PYLINTER:
            return new pyLint_1.PyLinter();
        default:
            return new pyLint_1.PyLinter();
    }
}
function getLinterType(linter) {
    if (linterMap.has(linter)) {
        return linterMap.get(linter);
    }
    return linterMap.get(DEFAULT_LINTER);
}
// This handler provides the initial list of the completion items.
// connection.onCompletion((textDocumentPosition: TextDocumentIdentifier): CompletionItem[] => {
//     // The pass parameter contains the position of the text document in 
//     // which code complete got requested. For the example we ignore this
//     // info and always provide the same completion items.
//     return [
//         {
//             label: 'TypeScript',
//             kind: CompletionItemKind.Text,
//             data: 1
//         },
//         {
//             label: 'JavaScript',
//             kind: CompletionItemKind.Text,
//             data: 2
//         }
//     ]
// });
// // This handler resolve additional information for the item selected in
// // the completion list.
// connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
//     if (item.data === 1) {
//         item.detail = 'TypeScript details',
//         item.documentation = 'TypeScript documentation'
//     } else if (item.data === 2) {
//         item.detail = 'JavaScript details',
//         item.documentation = 'JavaScript documentation'
//     }
//     return item; 
// });
/*
connection.onDidOpenTextDocument((params) => {
    // A text document got opened in VSCode.
    // params.uri uniquely identifies the document. For documents store on disk this is a file URI.
    // params.text the initial full content of the document.
    connection.console.log(`${params.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
    // The content of a text document did change in VSCode.
    // params.uri uniquely identifies the document.
    // params.contentChanges describe the content changes to the document.
    connection.console.log(`${params.uri} changed: ${JSON.stringify(params.contentChanges) }`);
    connection.console.log(`${params.uri} documents: ${JSON.stringify(documents.keys()) }`);
});


connection.onDidCloseTextDocument((params) => {
    // A text document got closed in VSCode.
    // params.uri uniquely identifies the document.
    connection.console.log(`${params.uri} closed.`);
});
*/
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map