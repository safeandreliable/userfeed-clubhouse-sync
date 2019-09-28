const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const app = express();

if (process.env.NODE_ENV !== "PROD") {
  require("dotenv").config();
}

const config = require("./config");
const initConfig = config.init;
const chConfig = config.clubhouse;
const ufConfig = config.userfeed;
const dbConfig = config.db;

chConfig.idToColumns = Object.assign(
  {},
  ...Object.entries(chConfig.columnToIds).map(([a, b]) => ({ [b]: a }))
);

const ldbClass = require("./localDbUpdater");
const chpClass = require("./clubHousePusher");
const ufpClass = require("./userfeedPusher");

const ldb = new ldbClass(
  dbConfig.name,
  dbConfig.collection,
  dbConfig.url,
  ufConfig.statusesToPush
);
const chp = new chpClass(chConfig.apiToken, chConfig.columnToIds["grooming"]);
const ufp = new ufpClass(ufConfig.urls.stories, ufConfig.apiHeaders);

app.use(bodyParser());

// Begins listening to webhook from clubhouse for updates.
app.post("/webhook/clubhouse/", (req, res) => {
  const headerSignature = req.headers["clubhouse-signature"];
  console.log("-- inbound clubhouse webhook processing");
  const event = req.body;
  if (!chConfig.webhookSecret || validWedhook(headerSignature, event)) {
    processClubHouseChange(event);
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

// Server startup script
app.listen(initConfig.port, () => {
  console.log("App is running on port " + initConfig.port);

  ldb.initDbConnection().then(() => {
    // Functions to run on startup
    shouldSeed().then(() => {
      // Syncs any data that has changed while script has not been running from
      // userfeed to clubhoue and vice versa
      syncDataFromUserfeedToClubhouse().then(() => {
        syncDataFromClubhouseToUserfeed();
      });
      //
      // // Check updated userfeed stories based on time set in config
      setInterval(syncDataFromUserfeedToClubhouse, initConfig.pollTime);
    });
  });
});

// App shutdown
app.on("exit", () => {
  ldb.closeDbConnection();
});

// APP FUNCTIONS
// Decides whether the app should seed based on if there are any stories in the local db
const validWedhook = (headerSignature, event) => {
  var code = crypto
    .createHmac("sha256", chConfig.webhookSecret.toString("utf8"))
    .update(JSON.stringify(event), "utf8");

  const hexified = code.digest("hex");
  if (hexified === headerSignature) {
    console.log("---- webhook signature verified");
    return true;
  } else {
    console.log("---- unverified webhook. Not processing.");
    return false;
  }
};

const shouldSeed = () => {
  return new Promise((resolve, reject) => {
    ldb.storyCount().then(count => {
      if (count === 0) {
        console.log("Seeding data to local db since collection is empty");
        seedData().then(() => {
          resolve(true);
        });
      } else {
        console.log("There are stories in the local DB. No need to seed.");
        resolve(true);
      }
    });
  });
};

// Function to run when first setting up the app to add all existing userfeed stories to db
// and mark them as non-addable to clubhouse.
const seedData = () => {
  return new Promise((resolve, reject) => {
    ufp.loadPosts().then(stories => {
      resolve(ldb.seedDb(stories));
    });
  });
};

// checks userfeed for new or updated stories and adds them to userfeed
// if they meet the requirements in the configs (userfeed.statusesToPush)
const syncDataFromUserfeedToClubhouse = () => {
  console.log("Checking userfeed for new stories to push to clubhouse");
  return (
    ufp
      .loadPosts()
      // Update local database
      .then(stories => {
        return ldb.updateAndCreateStoriesLocal(stories);
      })
      // Find stories that are not in clubhouse
      .then(stories => {
        return ldb.findStories(false);
      })
      // Push stories to clubhouse
      .then(stories => {
        console.log("-- creating " + stories.length + " stories in clubhouse.");
        return chp.createStories(stories);
      })
      .then(stories => {
        return ufp.linkStoriesToClubHouse(stories);
      })
      // Reupdate stories in the database
      .then(stories => {
        return ldb.updateAndCreateStoriesLocal(stories);
      })
  );
};

// Function to run if script has been down for a while to sync up data changes that happened
const syncDataFromClubhouseToUserfeed = () => {
  console.log(
    "Checking clubhouse for changes to push to userfeed that happened while script wasn't running"
  );
  ldb.findStories(true).then(stories => {
    stories.forEach(story => {
      // Built event so the same function that is used for the webhook can be used for
      // initial data sync on startup
      const event = {
        primary_id: story.clubhouseId,
        actions: [
          {
            changes: {
              workflow_state_id: { new: story.clubhouseData.workflow_state_id }
            }
          }
        ]
      };
      return processClubHouseChange(event);
    });
  });
};

// Updates story status in userfeed if nessecary
const processClubHouseChange = event => {
  const storyId = event.primary_id;
  const changes = event.actions[0].changes;

  // Only acts if workflow_state_id changes (columns)
  if (changes && changes.workflow_state_id) {
    ldb.findStory(storyId).then(story => {
      const newChColumnId = changes.workflow_state_id.new;
      const newChColumn = chConfig.idToColumns[newChColumnId];
      const newUfStatus = chConfig.statusMapping[newChColumn];

      // Only updates if the userfeed status will change
      if (newUfStatus && story.userfeedData.status != newUfStatus) {
        ufp
          .updateStatus(story, newUfStatus)
          .then(story => {
            // Updates record in our local db
            return ldb.updateAndCreateStoriesLocal([story]);
          })
          .catch(err => {
            console.log(err);
          });
      } else {
        console.log(
          "-- Story " +
            story.clubhouseId +
            ": '" +
            story.clubhouseData.name +
            "' status doesn't need to be updated"
        );
      }
    });
  }
};
