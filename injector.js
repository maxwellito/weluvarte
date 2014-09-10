/**
 * WE LUV ARTE
 * v.0.1 [alpha]
 *
 * This is a bit semantic, but who care, this is just a bad hack.
 * 
 */

(function () {
  var HTML_INTRO = '<h1>WE LUV\' ARTE</h1><p>Here the list of video(s) we could retrieve from the current page, with the different versions and qualities. <i>To download them, make a right click on a tag with the quality you want, then "Save the link as"</i></p>',
      HTML_WARN  = '<h2>That\'s awkward, but we cannot retrieve a video. Be sure you are on a valid page (: arte.tv). Otherwise go on <a href="http://maxwellito.github.io/weluvarte">http://maxwellito.github.io/weluvarte</a> for more information. Sorry.',
      DOM_CLASS  = 'wla',
      STYLE_TAG  = '<style>.' + DOM_CLASS + ' {position: absolute; top: 0; left: 0; padding: 2%; width: 100%; z-index: 99999; background: white;box-sizing: border-box;border-bottom: 5px solid #fd4600;} .' + DOM_CLASS + ' p a{font-weight: bold; color: white; padding:3px; border-radius: 3px; background: #333;} .' + DOM_CLASS + '_video {border-top: 3px solid black;}</style>';

  /**
   * 
   * Get the JSON url present in the DOM
   * 
   * @return {Array} List of URL
   */
  function getJsonsUrls () {
    var jsonUrl,
      jsonUrlList = [],
      tags = document.querySelectorAll('*[arte_vp_url]');

    // Find the URLs and remove duplicates
    for (i = 0; i < tags.length; i++) {
      if (!tags[i].attributes || !tags[i].attributes['arte_vp_url'] || !tags[i].attributes['arte_vp_url'].value) {
        // Ermm... that's embarrassing
        continue;
      }
      jsonUrl = tags[i].attributes['arte_vp_url'].value;
      if (jsonUrlList.indexOf(jsonUrl) === -1) {
        jsonUrlList.push(jsonUrl);
      }
    }
    return jsonUrlList;
  }

  /**
   * Make the XHR to load JSON files
   * then pass them to the callback
   * 
   * @param  {Array}   jsonUrls Array of JSON url to load
   * @param  {Function} callback Callback called once the requests are over
   */
  function sendRequests (jsonUrls, callback) {
    var xhr,
      orsc,
      requestCounter = 0,
      videoList = [];

    // onreadystatechange listener
    orsc = function (aEvt) {
      if (this.readyState == 4) {
        try {
          if (this.status == 200) {
            videoList.push(JSON.parse(this.responseText));
          }
        }
        catch (e) {}

        if (++requestCounter == jsonUrls.length) {
          callback(videoList);
        }
      }
    };

    // Let's make a reaquest for each JSON
    for (i = 0; i < jsonUrls.length; i++) {
      // Let's start the request
      xhr = new XMLHttpRequest();
      xhr.open('GET', jsonUrls[i], true);
      xhr.onreadystatechange = orsc;
      xhr.send(null);
    }

    if (jsonUrls.length === 0) {
      callback(videoList);
    }
  }

  /**
   * Parse the results and generate the final HTML
   * to inject in the page
   *
   * @param {array} videosInfo Array of video objects
   */
  function parseVideosInfo(videosInfo) {
    var i,
      finalDom,
      videoHtml,
      output = [];

    // Generate the template for each video
    for (i = 0; i < videosInfo.length; i++) {
      videoHtml = generateDom(videosInfo[i]);
      if (videoHtml) {
        output.push(videoHtml);
      }
    }

    // Insert intro
    output.unshift((output.length === 0) ? HTML_WARN : HTML_INTRO);
    output.push(STYLE_TAG);
    
    // Create and set the DOM
    finalDom = document.createElement('div');
    finalDom.className = DOM_CLASS;
    finalDom.innerHTML = output.join('');
    document.body.appendChild(finalDom);

    // Then scroll
    window.scrollTo(0,0);
  }

  /**
   * Parse a video object to it's HTML.
   * If the video is not parsable, the function
   * will return en empty string
   * 
   * @param  {Object} videoInfo Video info object
   * @return {String}           HTML
   */
  function generateDom (videoInfo) {
    var v, i, vsr,
      versions = {},
      output = '';

    if (!videoInfo.videoJsonPlayer || !videoInfo.videoJsonPlayer.VSR) {
      return output;
    }

    v = videoInfo.videoJsonPlayer;
    output += '<h3>' + v.VTI + ' [' + v.VTX + ']</h3>';

    output += '<p>';
    output += !!v.infoProg ? '<b>' + v.infoProg + '</b><br>' : '';
    output += !!v.VSU      ? '<b>' + v.VSU      + '</b><br>' : '';
    output += !!v.VDE      ?         v.VDE                   : '';
    output += '</p>';

    for(i in v.VSR) {
      vsr = v.VSR[i];
      if (i.substr(0,5) != "HTTP_") {
        continue;
      }

      if (!versions[vsr.versionLibelle]) {
        versions[vsr.versionLibelle] = [];
      }
      versions[vsr.versionLibelle].push('<a href="'+vsr.url+'" download>'+vsr.quality+'</a>');
    }

    for (i in versions) {
      output += '<p><b>' + i + '</b>: '+ versions[i].join(' ') +'</p>';
    }
    return '<div class="'+ DOM_CLASS + '_video">' + output + '</div>';
  }

  // Let's start the magic
  // Get the list of JSON url present in the current page
  var jsonUrls = getJsonsUrls();
  // Send the requests, and give the callback to call
  // once the requests are completed
  sendRequests(jsonUrls, parseVideosInfo);
})();