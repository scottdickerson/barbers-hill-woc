# Admin server for Wall of Champions

## TODOS

- Delete image if you edit a champion and replace the image
- Support version without image
- WOC character limits on each field

## Running the app locally

Production mode

```
npm run build
npm run start
```

Development mode

```
npm run tsc:watch
```

### URL

http://127.0.0.1:3000/

## Running integration testcases

Start the test server pointing to the test database and execute testcases

```
TEST_DB=barbers-hill-test npm start
npx playwright test --headed --project=chromium --workers=1 --debug
```

## Deploy to Heroku for testing

```~~~bash
heroku login
heroku git:remote -a barbers-hill-woc-server
npm run deploy
heroku config:set MONGO_HOSTNAME=cluster0.umj4z.mongodb.net
heroku config:set MONGO_USER=admin
heroku config:set MONGO_PASS=<normalpassword>
heroku config:set ENVIRONMENT=heroku

```

Open a browser to this URL for testing
https://barbers-hill-woc-server.herokuapp.com/

## Bring the remote database locally for actual production performance testing

Install mongodb database tools:
`https://docs.mongodb.com/database-tools/installation/installation-macos/`

Dump the remote db: https://docs.mongodb.com/database-tools/mongodump/

```
mongodump --uri=<url from the server console when starting pointing to remote db>
```

Delete the local db

Restore to local db: https://docs.mongodb.com/database-tools/mongorestore/

```
mongorestore

```
