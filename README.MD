# Admin server for Wall of Champions

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

## TODOS

- Delete image if you edit a champion and replace the image
