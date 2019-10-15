var Request;
(function (Request) {
    Request.type = { get method() { return 'request'; } };
})(Request = exports.Request || (exports.Request = {}));
(function (RequestEventType) {
    RequestEventType[RequestEventType["SAVE"] = 0] = "SAVE";
    RequestEventType[RequestEventType["OPEN"] = 1] = "OPEN";
    RequestEventType[RequestEventType["CONFIG"] = 2] = "CONFIG";
})(exports.RequestEventType || (exports.RequestEventType = {}));
var RequestEventType = exports.RequestEventType;
//# sourceMappingURL=request.js.map