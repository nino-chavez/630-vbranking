# Reference: API Endpoints

This document lists all REST API endpoints in the Volleyball Ranking Engine. These endpoints are used by the web application internally. There is no authentication required at this time.

All endpoints return JSON responses with a consistent structure:

```json
{
  "success": true,
  "data": { ... }
}
```

On error:

```json
{
	"success": false,
	"error": "Description of the error"
}
```

---

## Import Endpoints

### POST `/api/import/upload`

Parse an uploaded Excel spreadsheet and return a preview of the data.

**Content-Type:** `multipart/form-data`

**Request body (form fields):**

| Field       | Type          | Required | Description                                     |
| ----------- | ------------- | -------- | ----------------------------------------------- |
| `file`      | File (binary) | Yes      | The `.xlsx` file to parse. Maximum size: 10 MB. |
| `season_id` | string (UUID) | Yes      | The season to associate the import with.        |
| `age_group` | string        | Yes      | One of: `15U`, `16U`, `17U`, `18U`.             |
| `format`    | string        | Yes      | One of: `finishes`, `colley`.                   |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "rows": [ ... ],
    "errors": [
      {
        "row": 5,
        "column": "B",
        "message": "Missing team code",
        "severity": "error"
      }
    ],
    "identityConflicts": [
      {
        "type": "team",
        "parsedValue": "ABC VBC",
        "suggestions": [
          { "id": "uuid-here", "name": "ABC Volleyball Club", "code": "ABC", "score": 0.85 }
        ]
      }
    ],
    "metadata": {
      "format": "finishes",
      "totalRowsParsed": 150,
      "totalColumnsDetected": 45,
      "tournamentsDetected": ["AAU Nationals", "Regionals East"]
    }
  },
  "identityMappings": [
    { "type": "team", "parsedValue": "XYZ", "action": "map", "mappedId": "uuid-here" }
  ],
  "duplicates": {}
}
```

**Error responses:**

| Status | Condition                                                                    |
| ------ | ---------------------------------------------------------------------------- |
| 400    | Missing required field, invalid file type, invalid age_group, invalid format |
| 500    | Server error during parsing                                                  |

---

### POST `/api/import/confirm`

Commit parsed data to the database after preview and identity resolution.

**Content-Type:** `application/json`

**Request body:**

| Field              | Type          | Required | Description                                                  |
| ------------------ | ------------- | -------- | ------------------------------------------------------------ |
| `rows`             | array         | Yes      | The parsed rows (from the upload response).                  |
| `identityMappings` | array         | Yes      | Identity resolution mappings (matched, created, or skipped). |
| `importMode`       | string        | Yes      | One of: `merge`, `replace`.                                  |
| `seasonId`         | string (UUID) | Yes      | The target season.                                           |
| `ageGroup`         | string        | Yes      | One of: `15U`, `16U`, `17U`, `18U`.                          |
| `format`           | string        | Yes      | One of: `finishes`, `colley`.                                |

**Response (200):**

```json
{
	"success": true,
	"summary": {
		"rowsInserted": 120,
		"rowsUpdated": 15,
		"rowsSkipped": 5,
		"teamsCreated": 2,
		"tournamentsCreated": 1,
		"importMode": "merge",
		"timestamp": "2026-02-24T10:30:00.000Z",
		"seasonId": "uuid-here",
		"ageGroup": "18U"
	}
}
```

**Error responses:**

| Status | Condition                                            |
| ------ | ---------------------------------------------------- |
| 400    | Missing or invalid fields, validation errors on rows |
| 409    | Conflict when creating team or tournament records    |
| 500    | Server error during import                           |

---

## Ranking Endpoints

### POST `/api/ranking/run`

Execute a ranking computation for a season and age group.

**Content-Type:** `application/json`

**Request body:**

| Field       | Type          | Required | Description                         |
| ----------- | ------------- | -------- | ----------------------------------- |
| `season_id` | string (UUID) | Yes      | The season to compute rankings for. |
| `age_group` | string        | Yes      | One of: `15U`, `16U`, `17U`, `18U`. |

**Response (200):**

```json
{
	"success": true,
	"data": {
		"ranking_run_id": "uuid-here",
		"teams_ranked": 45,
		"ran_at": "2026-02-24T10:35:00.000Z",
		"seeding_factors": {
			"team-uuid": {
				"win_pct": 75.5,
				"best_national_finish": 2,
				"best_national_tournament_name": "AAU Nationals"
			}
		}
	}
}
```

**Error responses:**

| Status | Condition                              |
| ------ | -------------------------------------- |
| 400    | Missing season_id or invalid age_group |
| 500    | Server error during computation        |

---

### GET `/api/ranking/results`

Retrieve results for a specific ranking run.

**Query parameters:**

| Parameter        | Type          | Required | Description                           |
| ---------------- | ------------- | -------- | ------------------------------------- |
| `ranking_run_id` | string (UUID) | Yes      | The ranking run to fetch results for. |

**Response (200):**

```json
{
	"success": true,
	"data": {
		"results": [
			{
				"team_id": "uuid-here",
				"algo1_rating": 0.72,
				"algo1_rank": 1,
				"algo2_rating": 2456.3,
				"algo2_rank": 2,
				"algo3_rating": 2612.1,
				"algo3_rank": 1,
				"algo4_rating": 2701.5,
				"algo4_rank": 1,
				"algo5_rating": 2890.2,
				"algo5_rank": 2,
				"agg_rating": 85.42,
				"agg_rank": 1
			}
		],
		"teams": {
			"uuid-here": { "name": "Team ABC", "region": "Northeast" }
		},
		"overrides": {
			"uuid-here": {
				"original_rank": 3,
				"final_rank": 1,
				"justification": "Committee decision based on head-to-head record",
				"committee_member": "John Smith",
				"created_at": "2026-02-24T11:00:00.000Z",
				"updated_at": "2026-02-24T11:00:00.000Z"
			}
		},
		"run_status": "draft"
	}
}
```

**Error responses:**

| Status | Condition              |
| ------ | ---------------------- |
| 400    | Missing ranking_run_id |
| 500    | Server error           |

---

### GET `/api/ranking/runs`

List past ranking runs for a season, ordered by most recent first.

**Query parameters:**

| Parameter   | Type          | Required | Description                               |
| ----------- | ------------- | -------- | ----------------------------------------- |
| `season_id` | string (UUID) | Yes      | The season to fetch runs for.             |
| `age_group` | string        | No       | Filter by age group (15U, 16U, 17U, 18U). |

**Response (200):**

```json
{
	"success": true,
	"data": {
		"runs": [
			{
				"id": "uuid-here",
				"ran_at": "2026-02-24T10:35:00.000Z",
				"teams_ranked": 45,
				"status": "draft",
				"age_group": "18U"
			}
		]
	}
}
```

**Error responses:**

| Status | Condition         |
| ------ | ----------------- |
| 400    | Missing season_id |
| 500    | Server error      |

---

### POST `/api/ranking/runs/finalize`

Lock a ranking run so it cannot be modified further.

**Content-Type:** `application/json`

**Request body:**

| Field            | Type          | Required | Description                  |
| ---------------- | ------------- | -------- | ---------------------------- |
| `ranking_run_id` | string (UUID) | Yes      | The ranking run to finalize. |

**Response (200):**

```json
{
	"success": true,
	"data": { "status": "finalized" }
}
```

**Error responses:**

| Status | Condition                                           |
| ------ | --------------------------------------------------- |
| 400    | Missing ranking_run_id, or run is already finalized |
| 404    | Ranking run not found                               |
| 500    | Server error                                        |

---

## Override Endpoints

### GET `/api/ranking/overrides`

Retrieve all overrides for a ranking run.

**Query parameters:**

| Parameter        | Type          | Required | Description                             |
| ---------------- | ------------- | -------- | --------------------------------------- |
| `ranking_run_id` | string (UUID) | Yes      | The ranking run to fetch overrides for. |

**Response (200):**

```json
{
	"success": true,
	"data": {
		"overrides": {
			"team-uuid": {
				"original_rank": 5,
				"final_rank": 3,
				"justification": "Strong late-season performance",
				"committee_member": "Jane Doe",
				"created_at": "2026-02-24T11:00:00.000Z",
				"updated_at": "2026-02-24T11:00:00.000Z"
			}
		}
	}
}
```

---

### POST `/api/ranking/overrides`

Create or update an override for a team in a ranking run.

**Content-Type:** `application/json`

**Request body:**

| Field              | Type          | Required | Description                                          |
| ------------------ | ------------- | -------- | ---------------------------------------------------- |
| `ranking_run_id`   | string (UUID) | Yes      | The ranking run.                                     |
| `team_id`          | string (UUID) | Yes      | The team to override.                                |
| `original_rank`    | integer       | Yes      | The team's algorithmic rank.                         |
| `final_rank`       | integer       | Yes      | The desired final rank.                              |
| `justification`    | string        | Yes      | Reason for the override (minimum 10 characters).     |
| `committee_member` | string        | Yes      | Name of the committee member (minimum 2 characters). |

**Response (200):**

```json
{
	"success": true,
	"data": {
		"override": {
			"team_id": "uuid-here",
			"original_rank": 5,
			"final_rank": 3,
			"justification": "Strong late-season performance",
			"committee_member": "Jane Doe",
			"created_at": "2026-02-24T11:00:00.000Z",
			"updated_at": "2026-02-24T11:00:00.000Z"
		}
	}
}
```

**Error responses:**

| Status | Condition                                                         |
| ------ | ----------------------------------------------------------------- |
| 400    | Validation failed (missing fields, justification too short, etc.) |
| 403    | Ranking run is finalized and cannot be modified                   |
| 404    | Ranking run not found                                             |
| 500    | Server error                                                      |

---

### DELETE `/api/ranking/overrides`

Remove an override for a team.

**Query parameters:**

| Parameter        | Type          | Required | Description                        |
| ---------------- | ------------- | -------- | ---------------------------------- |
| `ranking_run_id` | string (UUID) | Yes      | The ranking run.                   |
| `team_id`        | string (UUID) | Yes      | The team whose override to remove. |

**Response (200):**

```json
{
	"success": true
}
```

**Error responses:**

| Status | Condition                   |
| ------ | --------------------------- |
| 400    | Missing required parameters |
| 403    | Ranking run is finalized    |
| 404    | Ranking run not found       |
| 500    | Server error                |

---

## Weight Endpoints

### GET `/api/ranking/weights`

Retrieve tournament weights for a season.

**Query parameters:**

| Parameter   | Type          | Required | Description                      |
| ----------- | ------------- | -------- | -------------------------------- |
| `season_id` | string (UUID) | Yes      | The season to fetch weights for. |

**Response (200):**

```json
{
	"success": true,
	"data": {
		"weights": [
			{
				"tournament_id": "uuid-here",
				"tournament_name": "AAU Nationals",
				"tournament_date": "2026-01-15",
				"weight": 3.0,
				"tier": 1,
				"has_custom_weight": true
			},
			{
				"tournament_id": "uuid-here",
				"tournament_name": "Local Qualifier",
				"tournament_date": "2025-11-10",
				"weight": 1.0,
				"tier": 5,
				"has_custom_weight": false
			}
		]
	}
}
```

---

### PUT `/api/ranking/weights`

Create or update tournament weight records for a season.

**Content-Type:** `application/json`

**Request body:**

| Field                     | Type          | Required | Description                           |
| ------------------------- | ------------- | -------- | ------------------------------------- |
| `season_id`               | string (UUID) | Yes      | The season.                           |
| `weights`                 | array         | Yes      | Array of weight objects (at least 1). |
| `weights[].tournament_id` | string (UUID) | Yes      | The tournament.                       |
| `weights[].weight`        | number        | Yes      | The weight multiplier.                |
| `weights[].tier`          | integer       | Yes      | The tier level (1-5).                 |

**Response (200):**

```json
{
	"success": true,
	"data": { "upserted": 3 }
}
```

**Error responses:**

| Status | Condition         |
| ------ | ----------------- |
| 400    | Validation failed |
| 500    | Server error      |

---

## Team Detail Endpoints

### GET `/api/ranking/team/[id]`

Retrieve team information.

**Path parameters:**

| Parameter | Type          | Description  |
| --------- | ------------- | ------------ |
| `id`      | string (UUID) | The team ID. |

**Response (200):**

```json
{
	"success": true,
	"data": {
		"team": {
			"id": "uuid-here",
			"name": "ABC Volleyball Club",
			"code": "ABC",
			"region": "Northeast",
			"age_group": "18U"
		}
	}
}
```

**Error responses:**

| Status | Condition      |
| ------ | -------------- |
| 404    | Team not found |
| 500    | Server error   |

---

### GET `/api/ranking/team/[id]/h2h`

Retrieve head-to-head records for a team in a season.

**Path parameters:**

| Parameter | Type          | Description  |
| --------- | ------------- | ------------ |
| `id`      | string (UUID) | The team ID. |

**Query parameters:**

| Parameter   | Type          | Required | Description |
| ----------- | ------------- | -------- | ----------- |
| `season_id` | string (UUID) | Yes      | The season. |

**Response (200):**

```json
{
	"success": true,
	"data": {
		"total_wins": 15,
		"total_losses": 5,
		"has_match_data": true,
		"opponents": [{ "id": "uuid", "name": "Team XYZ", "wins": 3, "losses": 1 }]
	}
}
```

If no match data is available, `has_match_data` is `false` and all counts are zero.

---

### GET `/api/ranking/team/[id]/history`

Retrieve tournament history for a team in a season.

**Path parameters:**

| Parameter | Type          | Description  |
| --------- | ------------- | ------------ |
| `id`      | string (UUID) | The team ID. |

**Query parameters:**

| Parameter   | Type          | Required | Description |
| ----------- | ------------- | -------- | ----------- |
| `season_id` | string (UUID) | Yes      | The season. |

**Response (200):**

```json
{
	"success": true,
	"data": {
		"history": [
			{
				"tournament_id": "uuid",
				"tournament_name": "AAU Nationals",
				"tournament_date": "2026-01-15",
				"division": "Open",
				"finish_position": 2,
				"field_size": 32
			}
		]
	}
}
```

---

_Last updated: 2026-02-24_
