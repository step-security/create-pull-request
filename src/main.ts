import * as core from '@actions/core'
import {Inputs, createPullRequest} from './create-pull-request'
import axios, {isAxiosError} from 'axios'
import * as fs from 'fs'
import {inspect} from 'util'
import * as utils from './utils'

function getDraftInput(): {value: boolean; always: boolean} {
  if (core.getInput('draft') === 'always-true') {
    return {value: true, always: true}
  } else {
    return {value: core.getBooleanInput('draft'), always: false}
  }
}

async function validateSubscription(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH
  let repoPrivate: boolean | undefined

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'))
    repoPrivate = eventData?.repository?.private
  }

  const upstream = 'peter-evans/create-pull-request'
  const action = process.env.GITHUB_ACTION_REPOSITORY
  const docsUrl =
    'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions'

  core.info('')
  core.info('[1;36mStepSecurity Maintained Action[0m')
  core.info(`Secure drop-in replacement for ${upstream}`)
  if (repoPrivate === false)
    core.info('[32m✓ Free for public repositories[0m')
  core.info(`[36mLearn more:[0m ${docsUrl}`)
  core.info('')

  if (repoPrivate === false) return

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
  const body: Record<string, string> = {action: action || ''}
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      {timeout: 3000}
    )
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `[1;31mThis action requires a StepSecurity subscription for private repositories.[0m`
      )
      core.error(
        `[31mLearn how to enable a subscription: ${docsUrl}[0m`
      )
      process.exit(1)
    }
    core.info('Timeout or API not reachable. Continuing to next step.')
  }
}

async function run(): Promise<void> {
  try {
    await validateSubscription()
    const inputs: Inputs = {
      token: core.getInput('token'),
      branchToken: core.getInput('branch-token'),
      path: core.getInput('path'),
      addPaths: utils.getInputAsArray('add-paths'),
      commitMessage: core.getInput('commit-message'),
      committer: core.getInput('committer'),
      author: core.getInput('author'),
      signoff: core.getBooleanInput('signoff'),
      branch: core.getInput('branch'),
      deleteBranch: core.getBooleanInput('delete-branch'),
      branchSuffix: core.getInput('branch-suffix'),
      base: core.getInput('base'),
      pushToFork: core.getInput('push-to-fork'),
      signCommits: core.getBooleanInput('sign-commits'),
      title: core.getInput('title'),
      body: core.getInput('body'),
      bodyPath: core.getInput('body-path'),
      labels: utils.getInputAsArray('labels'),
      assignees: utils.getInputAsArray('assignees'),
      reviewers: utils.getInputAsArray('reviewers'),
      teamReviewers: utils.getInputAsArray('team-reviewers'),
      milestone: Number(core.getInput('milestone')),
      draft: getDraftInput(),
      maintainerCanModify: core.getBooleanInput('maintainer-can-modify')
    }
    core.debug(`Inputs: ${inspect(inputs)}`)

    if (!inputs.token) {
      throw new Error(`Input 'token' not supplied. Unable to continue.`)
    }
    if (!inputs.branchToken) {
      inputs.branchToken = inputs.token
    }
    if (inputs.bodyPath) {
      if (!utils.fileExistsSync(inputs.bodyPath)) {
        throw new Error(`File '${inputs.bodyPath}' does not exist.`)
      }
      // Update the body input with the contents of the file
      inputs.body = utils.readFile(inputs.bodyPath)
    }
    // 65536 characters is the maximum allowed for the pull request body.
    if (inputs.body.length > 65536) {
      core.warning(
        `Pull request body is too long. Truncating to 65536 characters.`
      )
      inputs.body = inputs.body.substring(0, 65536)
    }

    await createPullRequest(inputs)
  } catch (error) {
    core.setFailed(utils.getErrorMessage(error))
  }
}

run()
