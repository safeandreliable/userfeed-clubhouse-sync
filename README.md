# Userfeed Clubhouse Syncer

To get this app running first setup all the following variables in the global env:

```
PORT - port that server will listen on
MONGODB_NAME - Mongo database name
MONGODB_URI - Url to mongo DB
CLUBHOUSE_API_TOKEN - Api token that clubhouse provides
USERFEED_COOKIE - This is the cookie that can be seen with request to userfeed within the network tab on the dev console.
```

To get the app setup and running first run: `npm install` (I may have forgotten a package or two)

Then just run `node app.js`
