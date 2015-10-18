'use strict';
/* global d3 */
/* global $ */

// load data
function createGraph(data) {

  d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
      this.parentNode.appendChild(this);
    });
  };

  var container = $('#chart');
  var strokeOpacity = 0.8;
  var margin = {
      top: 100,
      right: 20,
      bottom: 30,
      left: 100
    },
    width = 960 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

  /*
   * Colors
   */
  var color = d3.scale.category10();

  /*
   * Massage incoming data
   */
  data.forEach(function(d) {
    d.timelineDate = new Date(d.created_at).getTime();
    d.priority = +d.favorite_count + d.retweet_count;

    d.name = d.text;
    d.icon = 'fa-flash';

    var idForColor = d.retweeted_status ? d.retweeted_status.id : d.id;
    d.color = color(idForColor);
  });

  console.dir(data);

  /*
   * X/Y mappers Dots
   */
  var yMap = function(d) {
    var retVal = yScale(yValue(d));
    // Retweet
    if (d.retweeted_status) {
      retVal = retVal + getRetweetOffset(d.retweeted_status.retweet_count);
    }

    return retVal;
  }; // data -> display

  var xMap = function(d) {
    var retVal = xScale(xValue(d));

    // Retweet
    if (d.retweeted_status) {
      retVal = retVal + getRetweetOffset(d.retweeted_status.retweet_count);
    }

    return retVal;
  }; // data -> display

  /*
   * Utility
   */
  var getRandomBoolean = function() {
    return Math.random() < 0.5;
  };

  var getRandomArbitrary = function(min, max) {
    return Math.random() * (max - min) + min;
  };

  var getRetweetOffset = function(factor) {
    var outerPadding = 25;
    var innerPadding = 20;

    var min = innerPadding;
    var max = getCircleRadiusForTweet(factor) - outerPadding;
    var randomValue = getRandomArbitrary(min, max);

    randomValue = getRandomBoolean() ? randomValue : -randomValue;
    return randomValue;
  };

  var getCircleRadius = function(d) {
    // Retweet
    if (d.retweeted_status) {
      return 0;
    }
    // Tweet without retweets
    if (d.retweet_count === 0) {
      return 20;
    }
    // Tweet with retweets. Make radius twice the square size
    return getCircleRadiusForTweet(d.retweet_count);
  };

  var getSquareSize = function(d) {
    // Retweet
    if (d.retweeted_status) {
      return 15;
    }
    // Tweet without retweets
    if (d.retweet_count === 0) {
      return 20;
    }
    // Tweet with retweets
    return getSquareSizeForTweet(d.retweet_count);
  };

  var getCircleRadiusForTweet = function(factor) {
    return getSquareSizeForTweet(factor) * 2;
  };

  var getSquareSizeForTweet = function(factor) {
    return Math.round(20 + factor * 1.2);
  };

  /*
   * X/Y Getters
   */
  var xValue = function(d) {
    // Retweet
    if (d.retweeted_status) {
      return new Date(d.retweeted_status.created_at).getTime();
    }
    // Tweet with retweets
    return d.timelineDate;
  }; // data -> value

  var yValue = function(d) {
    // Retweet
    if (d.retweeted_status) {
      return d.retweeted_status.retweet_count;
    }
    // Tweet with retweets
    return d.retweet_count;
  }; // data -> value

  /*
   * Scales
   */
  var minX = d3.min(data, xValue);
  var maxX = d3.max(data, xValue);

  var xScale = d3.time.scale()
    .domain([new Date(minX), d3.time.day.offset(new Date(maxX), 1)])
    .rangeRound([0, width - margin.left - margin.right]);

  // Pow with exponent 0.5 is equivalent to using sqrt().
  var yScale = d3.scale.pow().exponent(0.5).range([height, 0]);

  /*
   * Setup axes
   */
  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom')
    .ticks(d3.time.days, 1)
    .tickFormat(d3.time.format('%d %b'))
    .tickSize(5)
    .tickPadding(8);

  var yAxis = d3.svg.axis().ticks(3).scale(yScale).orient('left');

  /*
   * Add graph to canvas of the webpage
   */
  var svg = d3.select('#chart').append('svg')
    // .attr('width', '100%')
    // .attr('height', '100%')
    // .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
    // .attr('preserveAspectRatio','xMinYMin')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // add the tooltip area to the webpage
  var tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // don't want dots overlapping axis, so add in buffer to data domain
  xScale.domain([d3.min(data, xValue) - 1, d3.max(data, xValue) + 1]);
  yScale.domain([d3.min(data, yValue) - 1, d3.max(data, yValue) + 1]);

  /*
   * Draw x-axis
   */
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)
    .append('text')
    .attr('class', 'label')
    .attr('x', width)
    .attr('y', -6)
    .style('text-anchor', 'end')
    .text('Time');

  /*
   * Draw y-axis
   */
  svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
    .attr('class', 'label')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '.71em')
    .style('text-anchor', 'end')
    .text('Retweets');

  /*
   * Draw elements
   */
  var elemEnter = svg.selectAll('.dot')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'dot')
    .attr('transform', function(d) {
      return 'translate(' + xMap(d) + ',' + yMap(d) + ')';
    })
    .append('g');

  /*
   * Tweet Circle
   */
  var circle = elemEnter.append('circle');
  circle
    .attr('r', 0)
    .attr('pointer-events', 'all')
    .on('mouseover', function(d) {
      // Show Tooltip
      var html = d.name + '<div class="tweet-info">' + d.user.screen_name + '<span>Favorites: ' + d.favorite_count + ' &bull; Retweets: ' + d.retweet_count + '</span></div>';
      tooltip.html(html)
        .style('border-color', d.color)
        .style('left', (d3.event.pageX + 5) + 'px')
        .style('top', (d3.event.pageY - 28) + 'px');

      tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
    })
    .on('mouseout', function(d) {
      // Hide Tooltip
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    })
    .transition().duration(Math.floor(Math.random() * 3000)).ease('linear')
    .attr('r', getCircleRadius)
    .style('fill', function(d) {
      return d.color;
    })
    .style('fill-opacity', function(d) {
      return d.retweeted_status ? 0 : 0.3;
    });

  /*
   * SVG Pattern (Image)
   */
  var defs = elemEnter.append('svg:defs');

  defs.append('svg:pattern')
    .attr('pointer-events', 'none')
    .attr('id', 'tile-ww')
    // .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', getSquareSize)
    .attr('height', getSquareSize)
    .append('svg:image')
    .attr('xlink:href', function(d) {
      return d.user.profile_image_url;
    })
    .attr('width', 0)
    .attr('height', 0)
    .attr('x', function(d) {
      return getSquareSize(d) / 2;
    })
    .attr('y', function(d) {
      return getSquareSize(d) / 2;
    })
    .transition().duration(Math.floor(Math.random() * 1000)).ease('linear')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', getSquareSize)
    .attr('height', getSquareSize);

  /*
   * Tweet Rectangle
   */
  elemEnter
    .append('rect')
    .attr('pointer-events', 'none')
    .attr('width', getSquareSize)
    .attr('height', getSquareSize)
    .attr('x', function(d) {
      return -getSquareSize(d) / 2;
    })
    .attr('y', function(d) {
      return -getSquareSize(d) / 2;
    })
    .attr('rx', function(d) {
      return getSquareSize(d) / 5;
    })
    .attr('ry', function(d) {
      return getSquareSize(d) / 5;
    })
    .style('fill', 'url(#tile-ww)')
    .style('fill-opacity', function(d) {
      return 1.0;
    })
    .style('stroke', function(d) {
      return d.color; //d.retweeted_status ? 'yellow' : 'white';
    })
    .style('stroke-width', function(d) {
      return d.retweeted_status ? 2 : d.priority / 5;
    })
    .style('stroke-opacity', strokeOpacity);

}
