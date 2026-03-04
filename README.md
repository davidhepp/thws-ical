# THWS iCal Filter

A web app that lets you subscribe to a filtered version of your THWS lecture schedule. Paste one or more iCal links, pick only the courses you care about, and get a personal calendar URL you can subscribe to in Apple Calendar, Google Calendar, or Outlook — auto-updating whenever the source schedule changes.

## Features

- **Multiple iCal sources** — combine events from several iCal feeds into one output feed
- **Course filter** — searchable list lets you select only the events you actually want
- **Persistent subscription URL** — generated once, stays up-to-date automatically

## Tech Stack

| Layer             | Technology                                                    |
| ----------------- | ------------------------------------------------------------- |
| Framework         | [Next.js 16](https://nextjs.org/) (App Router)                |
| Database          | [Neon](https://neon.tech/) (serverless PostgreSQL)            |
| ORM               | [Drizzle ORM](https://orm.drizzle.team/)                      |
| iCal parsing      | [ical.js](https://github.com/kewisch/ical.js)                 |
| iCal generation   | [ical-generator](https://github.com/sebbo2002/ical-generator) |
| Timezone handling | [Luxon](https://moment.github.io/luxon/)                      |
| Testing           | [Vitest](https://vitest.dev/)                                 |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/davidhepp/thws-ical.git
cd thws-ical
npm install
```

### 2. Set up the database

Create a PostgreSQL database on [Neon](https://neon.tech/) or any provider of your choice, then copy the connection string into a local env file:

```bash
cp env.example .env.local
```

Open `.env.local` and fill in your connection string:

```
DATABASE_URL="postgres://..."
```

### 3. Push the schema

```bash
npx drizzle-kit push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Paste your iCal link(s)** — enter one or more `.ics` URLs from your THWS faculty page. Click _Add another_ to combine multiple calendars.
2. **Select courses** — the app fetches and parses all feeds, then shows a searchable list of every unique event summary. Tick the ones you want.
3. **Copy your feed URL** — the app saves your configuration to the database and returns a stable `/api/feed/<id>` URL.
4. **Subscribe** — add that URL to your calendar app. It always serves a freshly filtered version of the upstream schedule.

## API Routes

| Route              | Method | Description                                                                                        |
| ------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| `/api/parse-feed`  | `POST` | Accepts `{ urls: string[] }`, returns `{ courses: string[] }` (unique sorted event summaries)      |
| `/api/create-feed` | `POST` | Accepts `{ urls: string[], selectedCourses: string[] }`, persists config, returns `{ id: string }` |
| `/api/feed/[id]`   | `GET`  | Fetches all source feeds, filters by saved courses, streams a valid `.ics` file                    |

## Database Schema

```ts
feeds {
  id             uuid        PK  default random
  original_url   text        NOT NULL
  additional_urls jsonb       nullable   -- extra iCal sources added later
  selected_courses jsonb      NOT NULL   -- string[]
  created_at     timestamp   NOT NULL   default now()
}
```

`additional_urls` is nullable so all rows created before multi-feed support was added continue to work without any migration.

## Testing

The project uses **Vitest** and **React Testing Library** for unit and integration testing. We test the core API routes by mocking external dependencies like database calls and internal fetches.

### Running tests

To run the test suite once:

```bash
npm run test
```

To run tests in watch mode (reruns on file changes):

```bash
npm run test:watch
```

## Deployment

Deploy to anywhere you like. Add `DATABASE_URL` as an environment variable in the project settings.

## License

MIT — not affiliated with THWS.
