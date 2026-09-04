# CampusOS Build Workflow

This folder is the implementation guide for building CampusOS as a three-member team. Read the documents in this order:

1. [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - target folders and responsibilities of each layer.
2. [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md) - delivery order, ownership, handoffs, and Git workflow.
3. [AI_BUILD_PROMPT.md](./AI_BUILD_PROMPT.md) - prompt to give an AI coding agent to build the application.
4. [ACCEPTANCE_TESTS.md](./ACCEPTANCE_TESTS.md) - manual and automated checks before submission.

The most important architectural rule is that the dashboard and AI agent must use the same persistent backend. The JSON files in `data/` are seed input only; they are not the live database.
