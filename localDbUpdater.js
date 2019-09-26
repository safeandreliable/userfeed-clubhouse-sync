const MongoClient = require("mongodb").MongoClient;
const Promise = require("rsvp").Promise;

module.exports = class localDbUpdater {
  constructor(dbName, dbCollection, url, ufStatusesToPush) {
    this.dbName = dbName;
    this.dbCollection = dbCollection;
    this.url = url;
    this.db = null;
    this.collection = null;
    this.client = null;

    this.ufStatusesToPush = ufStatusesToPush;
  }

  // Opens connection with mongo db
  initDbConnection() {
    const me = this;

    // Create a new MongoClient
    me.client = new MongoClient(me.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Use connect method to connect to the Server
    return me.client.connect().then(db => {
      me.db = me.client.db(me.dbName);
      me.collection = me.db.collection(me.dbCollection);
    });
  }

  // Closes connection with mongo db
  closeDbConnection() {
    this.client.close();
    this.db = null;
    this.collection = null;
    this.client = null;
  }

  // Adds all seed records with clubhouseId of 0 so that they will not be added to clubhouse.
  seedDb(records) {
    const me = this;

    records.forEach(record => {
      record.clubhouseId = 0;
    });

    // Insert all existing userfeedStories and make sure they are not pushed to clubhouse
    return me.collection.insertMany(records, function(err, result) {
      console.log("Seeded: " + result.insertedCount + " records inserted");
    });
  }

  // Returns number of stories in local db
  storyCount() {
    return this.collection.countDocuments({});
  }

  // Finds story record from DB
  findStory(id) {
    const me = this;
    return new Promise(function(resolve, reject) {
      me.collection.findOne({ clubhouseId: id }, function(err, story) {
        if (err) throw reject(err);
        resolve(story);
      });
    });
  }

  // Finds stories to push to clubhouse.
  // Requirements are that clubhouseId is null
  // and that has a status that has been deemed pushable.
  // This is setup in the config
  findStories(inClubhouse) {
    const me = this;
    return new Promise(function(resolve, reject) {
      me.collection
        .find({
          clubhouseId: { $exists: inClubhouse, $ne: 0 },
          "userfeedData.status": { $in: me.ufStatusesToPush }
        })
        .toArray(function(err, records) {
          if (err) throw reject(err);
          resolve(records);
        });
    });
  }

  // Updates or creates stories in local db depending on whether they already exist
  updateAndCreateStoriesLocal(records) {
    const me = this;

    // updates or creates story in DB
    return new Promise(function(resolve, reject) {
      records.forEach(record => {
        me.collection.findOneAndUpdate(
          { userfeedId: record.userfeedId },
          { $set: record },
          {
            upsert: true
          }
        );
      });
      resolve(records);
    });
  }
};
