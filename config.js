module.exports = {
  init: {
    // Port server will run on
    port: process.env.PORT,
    // Poll time to check for updates from userfeed
    pollTime: 1000 * 60
  },
  // DB setup
  db: {
    // Database name
    name: process.env.MONGODB_NAME,
    // Collection name
    collection: "stories",
    url: process.env.MONGODB_URI
  },
  clubhouse: {
    // Clubhouse api token
    apiToken: process.env.CLUBHOUSE_API_TOKEN,
    // Clubhouse webhook secret
    webhookSecret: process.env.CLUBHOUSE_WEBHOOK_SECRET,
    // Clubhouse columns to their ID's in the backend
    columnToIds: {
      grooming: 500000008,
      ready_for_development: 500000007,
      paused: 500000247,
      in_development: 500000006,
      ready_for_review: 500000010,
      ready_for_deploy: 500000009,
      deployed: 500000011
    },
    // Mapping Clubhouse statuses to Userfeed
    statusMapping: {
      grooming: "planned",
      ready_for_development: "planned",
      paused: "planned",
      in_development: "in_progress",
      ready_for_review: "in_progress",
      ready_for_deploy: "in_progress",
      deployed: "complete"
    }
  },
  userfeed: {
    // Statuses of stories that will be pushed to clubhouse
    statusesToPush: ["planned", "in_progress"],
    // General www request headers that must  be included
    apiHeaders: {
      "sec-fetch-mode": "cors",
      cookie: process.env.USERFEED_COOKIE,
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36",
      referer: "https://www.userfeed.io/safeandreliable/feedback",
      authority: "www.userfeed.io",
      "x-requested-with": "XMLHttpRequest",
      "sec-fetch-site": "same-origin"
    },
    urls: {
      // Url to request the stories feed.
      stories:
        "https://www.userfeed.io/safeandreliable/feedback.json?draw=1&columns%5B0%5D%5Bdata%5D=like_button&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=summary&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=comment_count&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=created_at&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=status&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=feed&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=false&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=labels&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=false&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=submitted_by&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=false&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=3&order%5B0%5D%5Bdir%5D=desc&start=0&length=100&search%5Bvalue%5D=&search%5Bregex%5D=false&label_match_type=any&_=1568326106403"
    }
  }
};
