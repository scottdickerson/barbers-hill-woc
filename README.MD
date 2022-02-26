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

## TODOS

- Delete image if you edit a champion and replace the image
