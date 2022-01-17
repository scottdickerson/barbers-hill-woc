# Admin server for Wall of Champions

## Deploy to Heroku for testing

```~~~bash
heroku login
heroku create barbers-hill-video-server
npm run deploy
heroku config:set MONGO_HOSTNAME=cluster0.umj4z.mongodb.net
heroku config:set MONGO_USER=admin
heroku config:set MONGO_PASS=<normalpassword>
heroku config:set ENVIRONMENT=heroku

```

## TODOS

- Delete image if you edit a champion and replace the image
