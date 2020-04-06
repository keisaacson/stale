import * as core from '@actions/core';
import * as github from '@actions/github';
import * as Octokit from '@octokit/rest';

type ProjectColumn = Octokit.ProjectsListColumnsResponseItem;
type ProjectCard = Octokit.ProjectsListCardsResponseItem;
type Issue = Octokit.IssuesGetResponse;
type IssueLabel = Octokit.IssuesGetResponseLabelsItem;

type Args = {
  repoToken: string;
  projectId: number;
  staleIssueMessage: string;
  stalePrMessage: string;
  daysBeforeStale: number;
  daysBeforeClose: number;
  staleIssueLabel: string;
  exemptIssueLabel: string;
  stalePrLabel: string;
  exemptPrLabel: string;
  operationsPerRun: number;
};

async function run() {
  try {
    const args = getAndValidateArgs();
    const client = new github.GitHub(args.repoToken);
    await processIssues(client, args, args.operationsPerRun);
  } catch (error) {
    console.log("Error: " + error);
    core.error(error);
    core.setFailed(error.message);
  }
}

async function processIssues(
  client: github.GitHub,
  args: Args,
  operationsLeft: number,
  page: number = 1
): Promise<number> {
  const issues = await getIssuesForProject(
    client,
    args.projectId,
    page
  );

  operationsLeft -= 1;

  if (issues.length === 0 || operationsLeft === 0) {
    return operationsLeft;
  }

  for (var issue of issues) {
    console.log(`Found issue: ${issue.title} last updated ${issue.updated_at}`);
    let isPr = !!issue.pull_request;

    let staleMessage = isPr ? args.stalePrMessage : args.staleIssueMessage;
    if (!staleMessage) {
      console.log(`Skipping ${isPr ? 'pr' : 'issue'} due to empty message`);
      continue;
    }

    let staleLabel = isPr ? args.stalePrLabel : args.staleIssueLabel;
    let exemptLabel = isPr ? args.exemptPrLabel : args.exemptIssueLabel;

    if (exemptLabel && isLabeled(issue, exemptLabel)) {
      continue;
    } else if (isLabeled(issue, staleLabel)) {
      if (wasLastUpdatedBefore(issue, args.daysBeforeClose)) {
        operationsLeft -= await closeIssue(client, issue);
      } else {
        continue;
      }
    } else if (wasLastUpdatedBefore(issue, args.daysBeforeStale)) {
      operationsLeft -= await markStale(
        client,
        issue,
        staleMessage,
        staleLabel
      );
    }

    if (operationsLeft <= 0) {
      core.warning(
        `performed ${args.operationsPerRun} operations, exiting to avoid rate limit`
      );
      return 0;
    }
  }
  return await processIssues(client, args, operationsLeft, page + 1);
}

async function getIssuesForProject(
  client: github.GitHub,
  projectId: number,
  page: number = 1
): Promise<Array<Issue>> {
  const columns = await client.projects.listColumns({
    project_id: projectId,
    page: page,
    per_page: 100
  })

  var cards = [];
  for (var column of columns.data) {
    let columnCards = await client.projects.listCards({
      column_id: column.id
    })
    cards = cards.concat(columnCards.data)
  }

  var issues = [];
  for (var card of cards) {
    if (!card.content_url) {
      console.log("Skipping Card " + card.url + " - not an issue")
      continue;
    }

    let splitUrl = card.content_url.split("/")
    let contentNumber = splitUrl.pop()
    let contentType = splitUrl.pop()
    let repo = splitUrl.pop()
    let owner = splitUrl.pop()

    if (contentType !== "issues") {
      console.log("Skipping Card " + card.content_url + " - not an issue")
      continue;
    }

    let issue = await client.issues.get({
      issue_number: contentNumber,
      repo: repo,
      owner: owner
    })

    if (issue.data.state === 'closed') {
      console.log("Skipping Issue '" + issue.data.title + "' - issue is closed")
      continue;
    } else if (issue.data.state === 'open') {
      console.log("Adding Issue '" + issue.data.title + "' to processing queue");
      issues.push(issue.data);
    }
  }

  return issues;
}

function isLabeled(issue: Issue, label: string): boolean {
  const labelComparer: (l: IssueLabel) => boolean = l =>
    label.localeCompare(l.name, undefined, {sensitivity: 'accent'}) === 0;
  return issue.labels.filter(labelComparer).length > 0;
}

function wasLastUpdatedBefore(issue: Issue, num_days: number): boolean {
  const daysInMillis = 1000 * 60 * 60 * 24 * num_days;
  const millisSinceLastUpdated =
    new Date().getTime() - new Date(issue.updated_at).getTime();
  return millisSinceLastUpdated >= daysInMillis;
}

async function markStale(
  client: github.GitHub,
  issue: Issue,
  staleMessage: string,
  staleLabel: string
): Promise<number> {
  console.log(`Marking issue ${issue.title} as stale`);

  let splitUrl = issue.html_url.split("/");
  let _contentNumber = splitUrl.pop();
  let _contentType = splitUrl.pop();
  let repo = splitUrl.pop();
  let owner = splitUrl.pop();

  await client.issues.createComment({
    owner: owner,
    repo: repo,
    issue_number: issue.number,
    body: staleMessage
  });

  await client.issues.addLabels({
    owner: owner,
    repo: repo,
    issue_number: issue.number,
    labels: [staleLabel]
  });

  return 2; // operations performed
}

async function closeIssue(
  client: github.GitHub,
  issue: Issue
): Promise<number> {
  console.log(`Closing issue ${issue.title} for being stale`);

  await client.issues.update({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issue.number,
    state: 'closed'
  });

  return 1; // operations performed
}

function getAndValidateArgs(): Args {
  const args = {
    repoToken: core.getInput('repo-token', {required: true}),
    projectId: parseInt(
      core.getInput('project-id', {required: true})
    ),
    staleIssueMessage: core.getInput('stale-issue-message'),
    stalePrMessage: core.getInput('stale-pr-message'),
    daysBeforeStale: parseInt(
      core.getInput('days-before-stale', {required: true})
    ),
    daysBeforeClose: parseInt(
      core.getInput('days-before-close', {required: true})
    ),
    staleIssueLabel: core.getInput('stale-issue-label', {required: true}),
    exemptIssueLabel: core.getInput('exempt-issue-label'),
    stalePrLabel: core.getInput('stale-pr-label', {required: true}),
    exemptPrLabel: core.getInput('exempt-pr-label'),
    operationsPerRun: parseInt(
      core.getInput('operations-per-run', {required: true})
    )
  };

  for (var numberInput of [
    'days-before-stale',
    'days-before-close',
    'operations-per-run'
  ]) {
    if (isNaN(parseInt(core.getInput(numberInput)))) {
      throw Error(`input ${numberInput} did not parse to a valid integer`);
    }
  }

  return args;
}

run();
