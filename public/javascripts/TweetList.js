var app = angular.module('Twitter', ['ngResource', 'ngSanitize']);

app.controller('TweetList', function($scope, $http, $resource, $timeout) {
  $scope.showList = false;

  /**
   * init controller and set defaults
   */
  function init() {

    // set a default username value
    $scope.username = "macounffm";

    // empty tweet model
    $scope.tweetsResult = [];

    if ($scope.showList) {
      // initiate masonry.js
      $scope.msnry = new Masonry('#tweet-list', {
        columnWidth: 320,
        itemSelector: '.tweet-item',
        transitionDuration: 0,
        isFitWidth: true
      });

      // layout masonry.js on widgets.js loaded event
      twttr.events.bind('loaded', function() {
        $scope.msnry.reloadItems();
        $scope.msnry.layout();
      });
    }

    // $scope.getTweets();
    $scope.getTweetsFromCache();
  }

  /**
   * requests and processes tweet data from cache file
   */
  $scope.getTweetsFromCache = function() {
    $http.get('cache/tweets.js').then(function(res) {
      createGraph(res.data);
    });
  }

  /**
   * requests and processes tweet data
   */
  function getTweets(paging) {

    var params = {
      action: 'search', //'user_timeline',
      q: '#macoun',
      count: 99
    };

    if ($scope.maxId) {
      params.max_id = $scope.maxId;
    }

    // create Tweet data resource
    $scope.tweets = $resource('/tweets/:action/:user', params);

    // GET request using the resource
    $scope.tweets.query({}, function(res) {

      if (angular.isUndefined(paging)) {
        $scope.tweetsResult = [];
      }

      $scope.tweetsResult = $scope.tweetsResult.concat(res);

      // Create Graph
      createGraph($scope.tweetsResult);

      // for paging - https://dev.twitter.com/docs/working-with-timelines
      $scope.maxId = res[res.length - 1].id;

      // render tweets with widgets.js
      $timeout(function() {
        twttr.widgets.load();
      }, 30);
    });
  }

  /**
   * binded to @user input form
   */
  $scope.getTweets = function() {
    $scope.maxId = undefined;
    getTweets();
  };

  /**
   * binded to 'Get More Tweets' button
   */
  $scope.getMoreTweets = function() {
    getTweets(true);
  };

  init();
});
