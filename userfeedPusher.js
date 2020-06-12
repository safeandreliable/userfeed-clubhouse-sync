const cheerio = require("cheerio");
const axios = require("axios");

module.exports = class userfeedPusher {
  constructor(storiesUrl, headers) {
    this.storiesUrl = storiesUrl;
    this.headers = headers;
  }

  // Loops through html recieved from Userfeed
  parseObjects(objects) {
    const me = this;
    let processedData = [];

    objects.forEach(obj => {
      processedData.push(me.parseData(obj));
    });
    return processedData;
  }

  // Parses each raw story into a DB format
  parseData(data) {
    const $ = cheerio.load(data.summary);
    const typeContainer = $("span")[0].children;
    let type = "";
    if (typeContainer) {
      type = typeContainer[0].data;
    }

    const processedData = {
      userfeedId: data.DT_RowId,
      userfeedData: {
        id: data.DT_RowId,
        status: data.status,
        title: $("a")[0].children[0].data,
        desc: $("p")[0].children[0].data,
        type: type.includes("Bug") ? "bug" : "feature",
        redirectUrl: "https://www.userfeed.io" + $("a")[0].attribs.href
      }
    };

    return processedData;
  }

  // Pulls all posts from userfeed server
  loadPosts() {
    const me = this;
    let headersCopy = Object.assign({}, this.headers);
    headersCopy["accept"] = "application/json, text/javascript, */*; q=0.01";

    return new Promise((resolve, reject) => {
      return axios
        .get(me.storiesUrl, { headers: headersCopy })
        .then(response => {
          const jsonBlob = response.data;
          const data = jsonBlob.data;
          return me.parseObjects(data);
        })
        .catch(error => {
          reject(error);
        })
        .then(data => {
          resolve(data);
        });
    });
  }

  // Loads single post page to get a redirected url and the html on the page so we can get form tokens
  getPostHtml(redirectUrl) {
    const me = this;
    let headersCopy = Object.assign({}, this.headers);
    headersCopy["accept"] =
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3";

    return axios
      .get(redirectUrl, { headers: headersCopy })
      .then(data => {
        let dataToReturn = {};

        dataToReturn.trueUrl = data.request.res.responseUrl;
        dataToReturn.html = data.data;

        return dataToReturn;
      })
      .catch(error => {
        console.log(error);
      });
  }

  // Finds the form auth token within the html
  findFormAuthenticityToken(story) {
    return this.getPostHtml(story.userfeedData.redirectUrl).then(data => {
      const $ = cheerio.load(data.html);
      const formToken = $("meta[name='csrf-token']")[0].attribs.content;

      story.userfeedData.trueUrl = data.trueUrl;

      return [story, formToken];
    });
  }

  // Loops through all new clubhouse stories to add link to userfeed story
  linkStoriesToClubHouse(stories) {
    const me = this;

    const linkedStories = stories.map(story => {
      return new Promise(resolve => {
        me.findFormAuthenticityToken(story).then(data => {
          resolve(me.addClubHouseLink(data[0], data[1]));
        });
      });
    });

    return Promise.all(linkedStories);
  }

  // Does the actual request to post a comment with the clubhouse story link in userfeed
  addClubHouseLink(story, formToken) {
    let me = this;

    return new Promise((resolve, reject) => {
      let headersCopy = Object.assign({}, me.headers);
      headersCopy["accept"] =
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3";
      headersCopy["content-type"] = "application/x-www-form-urlencoded";

      const urlData = `authenticity_token=${encodeURIComponent(
        formToken
      )}&utf8=%E2%9C%93&comment%5Bbody%5D=Clubhouse+story+url%3A%26nbsp%3B%3Ca+href%3D%22${encodeURIComponent(
        story.clubhouseData.app_url
      )}%22%3E${encodeURIComponent(
        story.clubhouseData.app_url
      )}%3C%2Fa%3E&comment%5Bvisibility%5D=internal`;

      const payload = {
        method: "post",
        url: story.userfeedData.trueUrl + "/comments",
        headers: headersCopy,
        data: urlData
      };

      return axios(payload)
        .then(res => {
          resolve(story);
        })
        .catch(err => {
          reject(err.response);
        });
    });
  }

  // Updates the status of a userfeed story
  updateStatus(story, newStatus) {
    const me = this;

    return new Promise((resolve, reject) => {
      me.findFormAuthenticityToken(story).then(data => {
        const updatedStory = data[0];

        let headersCopy = Object.assign({}, me.headers);
        headersCopy["accept"] =
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3";

        const urlData =
          "_method=put&authenticity_token=" + encodeURIComponent(data[1]);

        const payload = {
          method: "put",
          url:
            updatedStory.userfeedData.trueUrl +
            "/set_status?status=" +
            newStatus,
          headers: headersCopy,
          data: urlData
        };

        axios(payload)
          .then(res => {
            console.log(
              "---- updating UF story " +
                story.userfeedId +
                ": " +
                story.userfeedData.title +
                " status to: " +
                newStatus
            );
            updatedStory.userfeedData.status = newStatus;
            resolve(updatedStory);
          })
          .catch(err => {
            reject(err.response);
          });
      });
    });
  }
};
