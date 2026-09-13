## Build and Test
- Install: `bun`
- Test command: `bun test`

## Automations & Git Execution
- Upon successfully completing any feature block, ALWAYS run the test suite.
- If the tests pass, use your internal shell tool to execute: `git add .`
- Automatically commit with a meaningful Conventional Commit message describing the feature.
- Immediately execute `git push origin <your-branch-name>` right after the commit.

## Garbage Comments
- Do not add too much garbage comments throughout the project. Keep comments only for critical parts of the code.