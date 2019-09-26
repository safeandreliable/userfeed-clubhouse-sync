const axios = require("axios");

module.exports = class clubHousePusher {
  constructor(apiToken) {
    this.apiToken = apiToken;
  }

  // Loops through all new stories for clubhouse
  createStories(stories) {
    const me = this;
    const updatedStories = stories.map(story => {
      return new Promise(resolve => {
        resolve(me.createStory(story));
      });
    });

    return Promise.all(updatedStories);
  }

  // Builds desc for clubhouse story
  buildDescription(data) {
    return data.desc + "\n\n Userfeed Story Link: " + data.redirectUrl;
  }

  // Actual api interaction with clubhouse
  createStory(data) {
    const me = this;
    const url = "https://api.clubhouse.io/api/v2/stories";
    const ufData = data.userfeedData;

    // Adds to default column on clubhouse
    const payload = {
      name: ufData.title,
      description: me.buildDescription(ufData),
      external_id: data.id,
      project_id: 4,
      story_type: "feature"
    };

    return axios({
      method: "post",
      url: url,
      params: { token: me.apiToken },
      data: payload
    })
      .then(res => {
        data.clubhouseId = res.data.id;
        data.clubhouseData = res.data;
        return data;
      })
      .catch(err => {
        console.log(err.response);
      });
  }
};
