/**
 * WE LUV ARTE
 * v.0.1 [alpha]
 *
 * This is a bit semantic, but who care, this is just a bad hack.
 * If you like italian cuisine, you will love this spaguetti code, enjoy!
 *
 * To sort this out (a bit) here is some explanations:
 *
 *   0. Init
 *
 *   1. Retrieve data
 *      > Get the json url
 *      > Load them
 *
 *   2. Templating
 *      > Parse data to templating
 *      > Insert final dom
 *
 *   3. Chromecast
 *      > Init the chromecast (then display buttons if success)
 *
 */

(function (window) {

  /**
   * Const declarations
   * These variable must change during the execution
   *
   * HTML_INTRO    Panel introduction (html)
   * HTML_WARN     Warning message in case of problem (html)
   * HTML_CLOSE    Close button (html)
   * DOM_CLASS     Class name of the panel
   * CC_SCRIPT     Script url of the chromecast api
   * STYLE_TAG     Inline styling of the panel (html)
   */
  var HTML_INTRO = '<h1>WE LUV\' ARTE</h1><p>Here the list of video(s) we could retrieve from the current page, with the different versions and qualities. <i>To download them on bad browsers (:Internet Explorer and Safari), make a right click on a tag with the quality you want, then "Save the link as"</i></p><p>If you have a Chromecast, you can directly cast the videos on your TV. Just install the <a href="https://chrome.google.com/webstore/detail/google-cast/boadgeojelhgndaghljhdicfkmllpafd">Chrome Extension</a> then the cast option will be available.</p>',
      HTML_WARN  = '<h2>That\'s awkward, but we cannot retrieve a video. Be sure you are on a valid page (: arte.tv). Otherwise go on <a href="http://maxwellito.github.io/weluvarte">http://maxwellito.github.io/weluvarte</a> for more information. Sorry.',
      HTML_CLOSE = '<div onclick="this.parentNode.remove();" style="position:absolute; top:5px; right:5px;cursor: pointer;font-size: 3em;line-height: 0.5em;">&#215;</div>',
      DOM_CLASS  = 'wla',
      CC_SCRIPT  = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js',
      STYLE_TAG  = '<style>' +
                      '.' + DOM_CLASS + ' {position: absolute; top: 0; left: 0; padding: 2%; width: 100%; z-index: 99999; background: white; box-sizing: border-box; border-bottom: 15px solid #fd4600;} ' +
                      '.' + DOM_CLASS + ' .lbl{font-weight: bold; color: #fff; padding:5px; background-color: #333;} ' +
                      '.' + DOM_CLASS + ' .bttn {font-weight: bold; color: #000; padding:5px; border-left: 1px solid #666; cursor: pointer;} ' +
                      '.' + DOM_CLASS + ' .bttn_wrap{margin-left: 8px; border-radius: 3px; overflow: hidden; display: inline-block; vertical-align: bottom; border: 1px solid #333;} ' +
                      '.' + DOM_CLASS + ' .cc_bttn_wrap{display: none;} ' +
                      '.' + DOM_CLASS + ' .cc_bttn_wrap .lbl{background: url("//maxwellito.github.io/weluvarte/assets/chromecast_icon.svg") #333 no-repeat 4px center; background-size: 20px; padding-left: 30px;} ' +
                      '.' + DOM_CLASS + '_video {border-top: 3px solid black;}' +
                    '</style>';

  /**
   * INITIALIZE ***************************************************************
   *
   * Let's start the magic
   * Get the list of JSON url present in the current page
   *
   * Send the requests, and give the callback to call
   * once the requests are completed. This callback
   * will use the data returned to generate the panel
   * and insert it.
   *
   * Then finish by init the Chromecast
   */
  var jsonUrls = getJsonsUrls();
  sendRequests(jsonUrls, parseVideosInfo);
  initChromecast();


  /**
   * RETRIEVING DATA **********************************************************
   *
   * `XMLHttpRequest` and `querySelectorAll` is required
   */

  /**
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
   * TEMPLATING ***************************************************************
   *
   */

  /**
   * Parse the results and generate the final HTML
   * to inject in the page
   *
   * @param {array} videosInfo Array of video objects
   */
  function parseVideosInfo(videosInfo) {
    var i,
      finalDom,
      ccScriptDom,
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
    output.push(HTML_CLOSE);

    // Inject the Chromecast script
    ccScriptDom = document.createElement('script');
    ccScriptDom.src = CC_SCRIPT;
    document.body.appendChild(ccScriptDom);

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
    var v, i, vsrs, vsr,
      downloads = {},
      chromecast = {},
      output = '';

    if (!videoInfo.videoJsonPlayer || !videoInfo.videoJsonPlayer.VSR) {
      return output;
    }

    // Prepair the video by templating title and description
    v = videoInfo.videoJsonPlayer;
    output += '<h3>' + v.VTI + ' [' + v.VTX + ']</h3>';

    output += '<p>';
    output += !!v.infoProg ? '<b>' + v.infoProg + '</b><br>' : '';
    output += !!v.VSU      ? '<b>' + v.VSU      + '</b><br>' : '';
    output += !!v.VDE      ?         v.VDE                   : '';
    output += '</p>';

    // Get the video qualities
    vsrs = sortVsrs(v.VSR);
    for (i = 0; i < vsrs.length; i++) {
      vsr = vsrs[i];
      if (vsr.streamName.substr(0,5) != "HTTP_") {
        continue;
      }

      if (!downloads[vsr.versionLibelle]) {
        downloads[vsr.versionLibelle] = [];
        chromecast[vsr.versionLibelle] = [];
      }
      downloads[vsr.versionLibelle].push('<a class="bttn" href="'+vsr.url+'" download>'+vsr.quality+'</a>');
      chromecast[vsr.versionLibelle].push('<span class="bttn cc_btn" onclick="chromecaster(' +
        '\'' + vsr.url + '\', ' +
        '\'' + stripSlashes(v.VTI) + '\', ' +
        '\'' + stripSlashes(v.infoProg) + '\', ' +
        (v.videoDurationSeconds || '') +
      ')" />'+vsr.quality+'</span>');
    }

    for (i in downloads) {
      output += '<p>' +
                  '<strong>' + i + '</strong>' +
                  '<span class="bttn_wrap">' +
                    '<span class="lbl">Download</span>' +
                    downloads[i].join('') +
                  '</span>' +
                  '<span class="bttn_wrap cc_bttn_wrap">' +
                    '<span class="lbl">Chromecast</span>' +
                    chromecast[i].join('') +
                  '</span>' +
                '</p>';
    }
    return '<div class="'+ DOM_CLASS + '_video">' + output + '</div>';
  }

  /**
   * Transform VSR object from JSON object to array
   * sorted by bitrate. The method add the attribute
   * `streamName` which contain the object key.
   *
   * @param {Object} input VSR object from JSON data object
   * @return {Array} VSR object as array, sorted by bitrate
   */
  function sortVsrs (input) {
    var i, output = [];

    if (input) {
      for (i in input) {
        input[i]['streamName'] = i;
        output.push(input[i]);
      }
      output = output.sort(function (a, b) {
        return a.bitrate - b.bitrate;
      });
    }
    return output;
  }

  /**
   * Strip slashes
   *
   * 
   */
  function stripSlashes (input) {
    return input.replace(/\\(.)/mg, '$1');
  }


  /**
   * CHROMECAST ***************************************************************
   *
   * In these method, the object `console` is used, quite often.
   * But this code can only be executed in a Chrome environment,
   * so the `console` object will be available and won't break
   * the code.
   *
   * This part of the code is still in beta test, the log will
   * be used to debug the script if necessary.
   */

  /**
   * Init the Chromecast to check if the API is available
   * and get the necessary IDs
   *
   */
  function initChromecast () {

    // Avoid init if window.chromecaster is declared
    if (window.chromecaster) {
      return;
    }

    // Listener setup for when the chromecast is available
    window['__onGCastApiAvailable'] = function (loaded, errorInfo) {
      if (loaded) {
        initializeCastApi();
      } else {
        console.error('Chromecast API error', errorInfo);
      }
    };

    // Check if the Chromecast is initialised
    // (might happend if one day Arte implement the Chromecast)
    if (!chrome.cast || !chrome.cast.isAvailable) {
      setTimeout(initializeCastApi, 1000);
    }

    // Init the Cast API
    function initializeCastApi () {
      console.info('Initialize Chromecast API');
      var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
      var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, receiverListener);
      chrome.cast.initialize(apiConfig, onInitSuccess, onError);
    }

    function sessionListener (e) {
      console.log('SessionListener', e);
    }

    function receiverListener (e) {
      if (e === chrome.cast.ReceiverAvailability.AVAILABLE) {
        // Perfect time to show the chromecast button
        console.info('Chromecast available');
        var btns = document.querySelectorAll('.cc_bttn_wrap');
        for (i = 0; i < btns.length; i++) {
          btns[i].style.display = 'inline-block';
        }
      }
      else {
        console.error('Chromecast not available');
      }
    }

    function onInitSuccess () {
      console.info('Succesfully init');
    }

    function onError (e) {
      console.error('Init failed', e);
    }
  }

  /**
   * Start to cast the video URL given as parameter.
   * The media must be a MP4 video.
   * This is the only one method available from
   * the global namespace.
   *
   * @param  {string} currentMediaURL Video URL
   */
  window.chromecaster = window.chromecaster = function (currentMediaURL, title, subtitle, duration) {

    if (window.chromecasterSession) {
      onRequestSessionSuccess(window.chromecasterSession);
    }
    else {
      // Request a session to cast
      chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
    }

    function onLaunchError (e) {
      console.error('Fail to request a session', e);
    }

    function onRequestSessionSuccess (session) {
      window.chromecasterSession = session;

      var mediaInfo = new chrome.cast.media.MediaInfo(currentMediaURL);
      mediaInfo.contentType    = 'video/mp4';
      mediaInfo.metadata       = {
        title:    title    || 'Arte +7',
        subtitle: subtitle || 'Chromecast pour Arte +7'
      };
      mediaInfo.customData     = null;
      mediaInfo.streamType     = chrome.cast.media.StreamType.BUFFERED;
      mediaInfo.textTrackStyle = new chrome.cast.media.TextTrackStyle();
      mediaInfo.duration       = (duration && parseInt(duration, 10)) || null;

      var request = new chrome.cast.media.LoadRequest(mediaInfo);
      session.loadMedia(request,
         onMediaDiscovered.bind(this, 'loadMedia'),
         onMediaError);

      function onMediaDiscovered(how, media) {
        console.info('Media discovered', how, media);
        currentMedia = media;
        currentMedia.play(null,
          function (e) {console.info('Media play success');},
          function (e) {console.error('Media play failed');}
        );
      }

      function onMediaError(e) {
        console.error('Media failed', e);
      }
    }
  };

})(window);
