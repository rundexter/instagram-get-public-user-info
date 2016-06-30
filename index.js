var _     = require('lodash')
  , q     = require('q')
  , agent = require('superagent')
;

module.exports = {
  browse: function(username) {
    var deferred = q.defer();

    agent
      .get('https://www.instagram.com/'+username)
      .end(deferred.makeNodeResolver());
      
    return deferred.promise   
      .then(function(response) {
        var re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm
          , match
          , window = {}
        ;

        while(( match=re.exec(response.text)  )) {
          //try to execute scripts, the one we're interested in will work, the rest will fail and that's ok 
          try { eval(match[1]); } catch(e) { }  //jshint ignore:line
        }

        if(window._sharedData) {
          var user = _.get(window._sharedData, 'entry_data.ProfilePage.0.user'); 
          return {
            username          : _.get(user, 'username')
            , full_name       : _.get(user, 'full_name')
            , profile_picture : _.get(user, 'profile_pic_url')
            , bio             : _.get(user, 'biography')
            , website         : _.get(user, 'external_url')
            , media           : _.get(user, 'counts.media')
            , follows         : _.get(user, 'follows.count')
            , followed_by     : _.get(user, 'followed_by.count')
          };
        } else {
          return {};
        }
      });
  }
  /**
   * The main entry point for the Dexter module
   *
   * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
   * @param {AppData} dexter Container for all data used in this workflow.
   */
  , run: function(step, dexter) {
    var self = this
      , usernames    = step.input('username')
    ;

    q.all(
      _.map(usernames, function(username) {
        return self.browse(username);
      })
    ).then(function(results) {
      self.complete(results);
    })
    .catch(this.fail.bind(this));
  }
};
