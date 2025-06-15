# Next Capital Radar API

API for the Next Capital Radar startup directory platform.

## Overview

This REST API allows users to submit, browse, and interact with a curated directory of startups. It supports public and admin endpoints for managing startup data, analytics, and engagement.

## Base URLs

- Production: `https://api.nextcapital.com/v1`
- Staging: `https://staging-api.nextcapital.com/v1`

## Main Features

- **Public Directory**: Browse approved startups with filters (sector, stage, country, tags, etc.).
- **Startup Submission**: Submit new startups for review and approval.
- **Startup Details**: Retrieve detailed info for a specific startup.
- **Engagement Tracking**: Track views, upvotes, and contact requests.
- **Pitch Deck Access**: Securely request access to startup pitch decks (authentication required).
- **Admin Endpoints**: Manage all startups, update status, and feature startups (admin authentication required).

## Authentication

- Some endpoints require Bearer JWT authentication (see OpenAPI spec for details).

## Endpoints

### Public

- `GET /startups`: List approved startups (with filters and pagination).
- `POST /startups`: Submit a new startup.
- `GET /startups/{id}`: Get startup by ID.
- `POST /startups/{id}/view`: Track a profile view.
- `POST /startups/{id}/upvote`: Add or remove an upvote.
- `POST /startups/{id}/contact`: Track a contact request.
- `GET /startups/{id}/pitch-deck`: Get pitch deck access URL (requires authentication).

### Admin

- `GET /admin/startups`: List all startups (pending, approved, rejected) — admin only.
- `PUT /admin/startups/{id}`: Update startup status, notes, or feature — admin only.

## Data Models

- **StartupSubmission**: Data required to submit a startup (name, pitch, description, sector, stage, founder info, etc.).
- **Startup**: All startup fields plus status, admin notes, upvotes, views, and more.
- **SubmissionResponse**: Standard response for create/update actions.
- **AdminUpdateRequest**: Payload for admin status updates.

## Error Handling

- Standard HTTP status codes (`400`, `401`, `403`, `404`, `500`) with descriptive messages.

## Contact

For support or questions, email [radar@nextcapital.com](mailto:radar@nextcapital.com).

---

_See `.openapi.yaml` for the full API specification._