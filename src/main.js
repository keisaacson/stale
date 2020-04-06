"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core = require("@actions/core");
var github = require("@actions/github");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var args, client, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    args = getAndValidateArgs();
                    client = new github.GitHub(args.repoToken);
                    return [4 /*yield*/, processIssues(client, args, args.operationsPerRun)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.log("Error: " + error_1);
                    core.error(error_1);
                    core.setFailed(error_1.message);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function processIssues(client, args, operationsLeft, page) {
    if (page === void 0) { page = 1; }
    return __awaiter(this, void 0, void 0, function () {
        var issues, _i, issues_1, issue, isPr, staleMessage, staleLabel, exemptLabel, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getIssuesForProject(client, args.projectId, page)];
                case 1:
                    issues = _c.sent();
                    operationsLeft -= 1;
                    if (issues.length === 0 || operationsLeft === 0) {
                        return [2 /*return*/, operationsLeft];
                    }
                    _i = 0, issues_1 = issues;
                    _c.label = 2;
                case 2:
                    if (!(_i < issues_1.length)) return [3 /*break*/, 11];
                    issue = issues_1[_i];
                    console.log("Found issue: " + issue.title + " last updated " + issue.updated_at);
                    isPr = !!issue.pull_request;
                    staleMessage = isPr ? args.stalePrMessage : args.staleIssueMessage;
                    if (!staleMessage) {
                        console.log("Skipping " + (isPr ? 'pr' : 'issue') + " due to empty message");
                        return [3 /*break*/, 10];
                    }
                    staleLabel = isPr ? args.stalePrLabel : args.staleIssueLabel;
                    exemptLabel = isPr ? args.exemptPrLabel : args.exemptIssueLabel;
                    if (!(exemptLabel && isLabeled(issue, exemptLabel))) return [3 /*break*/, 3];
                    return [3 /*break*/, 10];
                case 3:
                    if (!isLabeled(issue, staleLabel)) return [3 /*break*/, 7];
                    if (!wasLastUpdatedBefore(issue, args.daysBeforeClose)) return [3 /*break*/, 5];
                    _a = operationsLeft;
                    return [4 /*yield*/, closeIssue(client, issue)];
                case 4:
                    operationsLeft = _a - _c.sent();
                    return [3 /*break*/, 6];
                case 5: return [3 /*break*/, 10];
                case 6: return [3 /*break*/, 9];
                case 7:
                    if (!wasLastUpdatedBefore(issue, args.daysBeforeStale)) return [3 /*break*/, 9];
                    _b = operationsLeft;
                    return [4 /*yield*/, markStale(client, issue, staleMessage, staleLabel)];
                case 8:
                    operationsLeft = _b - _c.sent();
                    _c.label = 9;
                case 9:
                    if (operationsLeft <= 0) {
                        core.warning("performed " + args.operationsPerRun + " operations, exiting to avoid rate limit");
                        return [2 /*return*/, 0];
                    }
                    _c.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 2];
                case 11: return [4 /*yield*/, processIssues(client, args, operationsLeft, page + 1)];
                case 12: return [2 /*return*/, _c.sent()];
            }
        });
    });
}
function getIssuesForProject(client, projectId, page) {
    if (page === void 0) { page = 1; }
    return __awaiter(this, void 0, void 0, function () {
        var columns, cards, _i, _a, column, columnCards, issues, _b, cards_1, card, splitUrl, contentNumber, contentType, repo, owner, issue;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, client.projects.listColumns({
                        project_id: projectId,
                        page: page,
                        per_page: 100
                    })];
                case 1:
                    columns = _c.sent();
                    cards = [];
                    _i = 0, _a = columns.data;
                    _c.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    column = _a[_i];
                    return [4 /*yield*/, client.projects.listCards({
                            column_id: column.id
                        })];
                case 3:
                    columnCards = _c.sent();
                    cards = cards.concat(columnCards.data);
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    issues = [];
                    _b = 0, cards_1 = cards;
                    _c.label = 6;
                case 6:
                    if (!(_b < cards_1.length)) return [3 /*break*/, 9];
                    card = cards_1[_b];
                    if (!card.content_url) {
                        console.log("Skipping Card " + card.url + " - not an issue");
                        return [3 /*break*/, 8];
                    }
                    splitUrl = card.content_url.split("/");
                    contentNumber = splitUrl.pop();
                    contentType = splitUrl.pop();
                    repo = splitUrl.pop();
                    owner = splitUrl.pop();
                    if (contentType !== "issues") {
                        console.log("Skipping Card " + card.content_url + " - not an issue");
                        return [3 /*break*/, 8];
                    }
                    return [4 /*yield*/, client.issues.get({
                            issue_number: contentNumber,
                            repo: repo,
                            owner: owner
                        })];
                case 7:
                    issue = _c.sent();
                    if (issue.data.state === 'closed') {
                        console.log("Skipping Issue '" + issue.data.title + "' - issue is closed");
                        return [3 /*break*/, 8];
                    }
                    else if (issue.data.state === 'open') {
                        console.log("Adding Issue '" + issue.data.title + "' to processing queue");
                        issues.push(issue.data);
                    }
                    _c.label = 8;
                case 8:
                    _b++;
                    return [3 /*break*/, 6];
                case 9: return [2 /*return*/, issues];
            }
        });
    });
}
function isLabeled(issue, label) {
    var labelComparer = function (l) {
        return label.localeCompare(l.name, undefined, { sensitivity: 'accent' }) === 0;
    };
    return issue.labels.filter(labelComparer).length > 0;
}
function wasLastUpdatedBefore(issue, num_days) {
    var daysInMillis = 1000 * 60 * 60 * 24 * num_days;
    var millisSinceLastUpdated = new Date().getTime() - new Date(issue.updated_at).getTime();
    return millisSinceLastUpdated >= daysInMillis;
}
function markStale(client, issue, staleMessage, staleLabel) {
    return __awaiter(this, void 0, void 0, function () {
        var splitUrl, _contentNumber, _contentType, repo, owner;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Marking issue " + issue.title + " as stale");
                    splitUrl = issue.html_url.split("/");
                    _contentNumber = splitUrl.pop();
                    _contentType = splitUrl.pop();
                    repo = splitUrl.pop();
                    owner = splitUrl.pop();
                    return [4 /*yield*/, client.issues.createComment({
                            owner: owner,
                            repo: repo,
                            issue_number: issue.number,
                            body: staleMessage
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, client.issues.addLabels({
                            owner: owner,
                            repo: repo,
                            issue_number: issue.number,
                            labels: [staleLabel]
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, 2]; // operations performed
            }
        });
    });
}
function closeIssue(client, issue) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Closing issue " + issue.title + " for being stale");
                    return [4 /*yield*/, client.issues.update({
                            owner: github.context.repo.owner,
                            repo: github.context.repo.repo,
                            issue_number: issue.number,
                            state: 'closed'
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, 1]; // operations performed
            }
        });
    });
}
function getAndValidateArgs() {
    var args = {
        repoToken: core.getInput('repo-token', { required: true }),
        projectId: parseInt(core.getInput('project-id', { required: true })),
        staleIssueMessage: core.getInput('stale-issue-message'),
        stalePrMessage: core.getInput('stale-pr-message'),
        daysBeforeStale: parseInt(core.getInput('days-before-stale', { required: true })),
        daysBeforeClose: parseInt(core.getInput('days-before-close', { required: true })),
        staleIssueLabel: core.getInput('stale-issue-label', { required: true }),
        exemptIssueLabel: core.getInput('exempt-issue-label'),
        stalePrLabel: core.getInput('stale-pr-label', { required: true }),
        exemptPrLabel: core.getInput('exempt-pr-label'),
        operationsPerRun: parseInt(core.getInput('operations-per-run', { required: true }))
    };
    for (var _i = 0, _a = [
        'days-before-stale',
        'days-before-close',
        'operations-per-run'
    ]; _i < _a.length; _i++) {
        var numberInput = _a[_i];
        if (isNaN(parseInt(core.getInput(numberInput)))) {
            throw Error("input " + numberInput + " did not parse to a valid integer");
        }
    }
    return args;
}
run();
