var express = require('express');
var router = express.Router();
var Twit = require('twit');
var config = require('../config');
var _ = require('lodash');

// instantiate Twit module
var twitter = new Twit(config.twitter);

var TWEET_COUNT = 20;
var MAX_COUNT_PER_REQUEST = 100;
var MAX_WIDTH = 305;
var OEMBED_URL = 'statuses/oembed';
var USER_TIMELINE_URL = 'statuses/user_timeline';
var USER_MENTIONS_URL = 'statuses/mentions_timeline';
var SEARCH_URL = 'search/tweets';

/**
 * GET tweets json.
 */
router.get('/user_timeline/:user', function(req, res) {

  var oEmbedTweets = [], tweets = [],

  params = {
    screen_name: req.params.user, // the user id passed in as part of the route
    count: TWEET_COUNT // how many tweets to return
  };

  // the max_id is passed in via a query string param
  if(req.query.max_id) {
    params.max_id = req.query.max_id;
  }

  // request data
  twitter.get(USER_TIMELINE_URL, params, function (err, data, resp) {

    tweets = data;

    var i = 0, len = tweets.length;

    for(i; i < len; i++) {
      getOEmbed(tweets[i]);
    }
  });

  /**
   * requests the oEmbed html
   */
  function getOEmbed (tweet) {

    // oEmbed request params
    var params = {
      "id": tweet.id_str,
      "maxwidth": MAX_WIDTH,
      "hide_thread": true,
      "omit_script": true
    };

    // request data
    twitter.get(OEMBED_URL, params, function (err, data, resp) {
      tweet.oEmbed = data;
      oEmbedTweets.push(tweet);

      // do we have oEmbed HTML for all Tweets?
      if (oEmbedTweets.length == tweets.length) {
        res.setHeader('Content-Type', 'application/json');
        res.send(oEmbedTweets);
      }
    });
  }
});

/**
 * GET tweets json.
 */
router.get('/mentions_timeline', function(req, res) {

  var oEmbedTweets = [], tweets = [],

  params = {
    screen_name: req.params.user, // the user id passed in as part of the route
    count: TWEET_COUNT // how many tweets to return
  };

  // the max_id is passed in via a query string param
  if(req.query.max_id) {
    params.max_id = req.query.max_id;
  }

  // request data
  twitter.get(USER_MENTIONS_URL, params, function (err, data, resp) {

    tweets = data;

    var i = 0, len = tweets.length;

    for(i; i < len; i++) {
      getOEmbed(tweets[i]);
    }
  });

  /**
   * requests the oEmbed html
   */
  function getOEmbed (tweet) {

    // oEmbed request params
    var params = {
      "id": tweet.id_str,
      "maxwidth": MAX_WIDTH,
      "hide_thread": true,
      "omit_script": true
    };

    // request data
    twitter.get(OEMBED_URL, params, function (err, data, resp) {
      tweet.oEmbed = data;
      oEmbedTweets.push(tweet);

      // do we have oEmbed HTML for all Tweets?
      if (oEmbedTweets.length == tweets.length) {
        res.setHeader('Content-Type', 'application/json');
        res.send(oEmbedTweets);
      }
    });
  }
});

/**
 * GET tweets json.
 *
 * cd public/cache
 * curl -o tweets.js 'http://localhost:5000/tweets/search?q=%23macoun&count=150'
 */
router.get('/search', function(req, res) {

  var oEmbedTweets = [], tweets = [],

  params = {
    q: req.query.q, // the user id passed in as part of the route
    result_type: 'recent'
  };

  // how many tweets to return
  var desiredCount = (req.query.count) ? req.query.count : TWEET_COUNT;
  var receivedCount = 0;
  var results = [];

  // Reduce count if more than maximum per request.
  params.count = desiredCount;
  if (desiredCount > MAX_COUNT_PER_REQUEST) {
    params.count = MAX_COUNT_PER_REQUEST;
  }

  // Get tweets!
  getTweets(params);

  function addToResults (tweets) {
    _.forEach(tweets, function(tweet) {
      results.push(tweet);
    });

    // Remove duplicate tweets
    results = _.uniq(results, function(item, key, a) {
      return item.id;
    });
  }

  function getTweets (params, max_id) {
    var lastId;

    if (max_id) {
      params.max_id = max_id;
    }

    console.log('');
    console.log('--> Load next ' + params.count + ' tweets, params: ', params);

    // request data
    twitter.get(SEARCH_URL, params, function (err, data, resp) {
      if (err) {
        console.log('--> Error: ', err);
      };
      tweets = data['statuses'];

      var i = 0, len = tweets.length;

      for(i; i < len; i++) {
        getOEmbed(tweets[i]);
      }

      lastId = tweets[len-1].id_str;

      receivedCount += len; // add number of tweets to received count
      console.log('--> Number of tweets received: ' + len);

      // Add tweets to list of all results
      addToResults(tweets);

      if (len > 1 && results.length < desiredCount) {

        getTweets(params, lastId);
        console.log('--> Load more tweets, older than: ' + lastId);
      } else {
        console.log('--> Done. Loaded tweets: ' + results.length);
        console.log('--> results.length: ' + results.length);
      }
    });
  }

  /**
   * requests the oEmbed html
   */
  function getOEmbed (tweet) {

    // oEmbed request params
    var params = {
      "id": tweet.id_str,
      "maxwidth": MAX_WIDTH,
      "hide_thread": true,
      "omit_script": true
    };

    // request data
    twitter.get(OEMBED_URL, params, function (err, data, resp) {
      tweet.oEmbed = data;
      oEmbedTweets.push(tweet);

      // do we have oEmbed HTML for all Tweets?
      if (oEmbedTweets.length == tweets.length) {
        res.setHeader('Content-Type', 'application/json');
        res.send(oEmbedTweets);
      }
    });
  }
});

module.exports = router;
