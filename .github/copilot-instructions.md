# SA-Rdf-Frontend Agent Instructions

- After modifying application code, routing logic, data loading, or tests, run `npm test` before finishing.
- If the change can affect the production bundle or runtime behavior, also run `npm run build` before finishing.
- Do not claim a change is complete until the relevant verification commands have been run, or you have clearly stated why they could not be run.
- In your final response, summarize the verification you ran and whether it passed.
- When adding or changing routing behavior, prefer adding or updating tests in `src/*.test.ts` so regressions are covered.