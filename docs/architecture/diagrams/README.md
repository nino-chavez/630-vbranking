# Architecture Diagrams

> Last updated: 2026-02-24

This directory contains Mermaid-based architecture diagrams for the Volleyball Ranking Engine. All diagrams are embedded in Markdown files and render natively in GitHub, VS Code, and any Mermaid-compatible viewer.

## Diagram Index

| Diagram                                       | File                     | Description                                                                                                                                                                                                                                                                                              | Scope                                                        |
| --------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [System Context](system-context.md)           | `system-context.md`      | C4 Level 1 view showing the system boundary, external actors (AAU Ranking Committee, Tournament Directors), data sources (XLSX spreadsheets), infrastructure (Supabase PostgreSQL), and outputs (CSV, XLSX, PDF exports).                                                                                | Highest-level: what the system is and who interacts with it. |
| [Data Flow](data-flow.md)                     | `data-flow.md`           | Three end-to-end data flow diagrams tracing the import pipeline (XLSX to database), ranking computation (data fetch through five algorithms to normalized results), and export pipeline (ranking state to downloadable files). Includes the normalization sub-pipeline and export column layout details. | How data moves through the system.                           |
| [Component Overview](component-overview.md)   | `component-overview.md`  | C4 Level 2 module dependency diagram decomposing the monolith into presentation layer, API layer, business logic (ranking engine, import pipeline, export module), and data access layer. Includes a module responsibility matrix and dependency rules.                                                  | Internal structure and module boundaries.                    |
| [Entity-Relationship](entity-relationship.md) | `entity-relationship.md` | Full ER diagram of the 9 PostgreSQL tables with column types, constraints, foreign key relationships, and ON DELETE behavior. Documents the 2 custom enums, 2 RPC functions, and all 15 migrations.                                                                                                      | Database schema and data model.                              |

## Reading Order

For a top-down understanding of the system:

1. **System Context** -- understand the actors, boundaries, and infrastructure.
2. **Component Overview** -- understand the internal module structure and dependency rules.
3. **Data Flow** -- trace data through the import, ranking, and export pipelines.
4. **Entity-Relationship** -- understand the database schema that underlies all data flows.

## Conventions

- All diagrams use Mermaid.js syntax embedded in fenced code blocks.
- Diagram files include an Overview section explaining what the diagram shows and why.
- Tables supplement diagrams with structured details (constraints, column layouts, module responsibilities).
- Diagrams reflect the implemented codebase, not aspirational designs.
