# Admin Dashboard Placeholder Records Cleanup

## Overview
Cleaned up the SQLite database (`conlatus.db`) by purging 5 unstarted test placeholder interview records (`"Pending Candidate"` / status: `"created"`).

## Problem
When interviews are initially synthesized or configured in the setup wizard, placeholder records are created with default names `"Pending Candidate"` and status `"pending"`. If test sessions are created without candidates entering the flow, the Admin Dashboard Overview and Candidate Tracker populate with multiple `"Pending Candidate"` rows with `"pending"` badges, causing visual clutter in the telemetry stream.

## Changes
1. Connected to SQLite database `backend/conlatus.db`.
2. Located and purged the 5 pending placeholder records (`status = 'created'`).
3. Verified the database count: Remaining interviews reset to 0.
4. The Admin Dashboard (`/admin`) and Candidate Tracker (`/admin/candidates`) now show clean empty states ("No candidate assessments found. Launch a new interview to begin telemetry!").
