// SPDX-FileCopyrightText: 2021-2026 HiZollo Dev Team
//
// SPDX-License-Identifier: EPL-2.0

const { spawn } = require('child_process');

function execute(commandName, args) {
  return new Promise((res, rej) => {
    const child = spawn(commandName, args)
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', data => { stdout += data })
    child.stderr.on('data', data => { stderr += data })

    child.on('close', code => {
      if (code !== 0) return rej(new Error(`${commandName} exited with code ${code}: ${stderr}`))
      res(stdout)
    })
  })
}

module.exports = { execute }
