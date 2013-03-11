
var Hopscotch = (function(){
  var Hopscotch = {}, Launcher, Scope, Action, EventEmitter;
  
  EventEmitter = Hopscotch.EventEmitter = function(){
  
    this.listeners = {}
    
  }
  
  EventEmitter.prototype.addEventListener = function(eventName, listener){
    if(!this.listeners[eventName]) this.listeners[eventName] = [];
    this.listeners[eventName].push(listener);
  }
    
  EventEmitter.prototype.on = function(){
    this.addEventListener.apply(this, arguments);
    return this;
  }
  
  EventEmitter.prototype.removeEventListener = function(eventName, listener){
    var eventListeners = this.listeners[eventName];
    if (eventListeners) {
      var filtered = [];
      eventListeners.forEach(function(existing){
        if(existing != listener) filtered.push(existing);
      })
      listeners[eventName] = filtered;
    };
  }
  
  EventEmitter.prototype.triggerEvent = function(eventName){
    var eventListeners = this.listeners[eventName];
    if (!eventListeners) return;
    for (var i=0; i < eventListeners.length; i++) {
      eventListeners[i].apply(null, [{
        name: eventName,
        target: this
      }].concat(Array.prototype.slice.call(arguments, 1)));
    };
  }
  
  EventEmitter.prototype.emit = function(){
    this.triggerEvent.apply(this, arguments);
  }
  
  /*
  An action is a single line item that will be presented in the filtered list
  Provides the token to filter on, what to display in the list and how to handle
  requests for autocompletion.
  */
  Action = Hopscotch.Action = function(token, options){
    EventEmitter.apply(this);
    if(!options){
      options = {}
    } else if (typeof(options) == 'function') {
      options = { onPerform:options };
    }
    this.token = token;
    this.type = options['type'] || 'generic';
    delete options['type'];
    this.options = {
      className: '' || options.className,
      showWhenBlank: (options.showWhenBlank === true),
      onScore: options.onScore || function(query){ return Action.score(this.token, query) },
      onAutocomplete : options.onAutocomplete || function(query){ return this.token; },
      onPerform : options.onPerform || function(actionEvent){
        return function(){throw("No Action defined for: " + this.token)};
      },
      onHTML: options.onHTML || function(){ return "<strong>" + this.token + "</strong>" }
    }
  
  }
  
  Action.prototype = Object.create(EventEmitter.prototype);

  /*
  Default scoring is the LiquidMetal score based on the Action's token
  */
  Action.prototype.score = function(query){
    if (Array.isArray(query)) {
      var last_query = this.last_query,
        action = this,
        score = query.reduce(function(score, query){
          return score + action.score(query);
        }, 0);
      this.last_query = last_query;
      return score;
    };
    try{
      query = query.trim();     
    } catch(e){
      console.log(query);
      throw(e);
    }
    this.last_query = query;
    if (!query || query.trim() == "") {
      return this.options.showWhenBlank ? 1 : 0;
    }
    return this.options.onScore.call(this, query);
  }

  /* basd on the currenty query, return what is provided for automplete */
  Action.prototype.autocomplete = function(query){
    return this.options.onAutocomplete.call(this, query || this.last_query);
  }
  
  Action.prototype.execute = function(){
    this.scope.performAction(this);
  }
  
  Action.prototype.perform = function(actionEvent){
    var onPerform = this.options.onPerform, result;
    if (typeof(onPerform == 'function')) {
      return this.options.onPerform.call(this, actionEvent);      
    }
  }

  Action.prototype.getHtml = function(query){
    return this.options.onHTML.call(this, query || this.last_query);
  }

  Action.score = function(token, query){
    return LiquidMetal.score(token, query);
  }

  /* A scope provides the context that the current search is being performed on */
  Scope = Hopscotch.Scope = function(title){
    this.title = title || "Untitled";
    this.actions = [];
    this.current_actions = [];
    var scope = this;
    
    Action.apply(this);
    this.token = this.title;
    
  }
  
  Scope.prototype = Object.create(Action.prototype);
  
  Scope.prototype.perform = function (actionEvent){
    actionEvent.launcher.pushScope(this);
    return;
  }
  
  Scope.prototype.addAction = function(action_or_token, options){
    var action, scope = this;
    if (typeof(action_or_token) == 'string' || action_or_token.constructor == String) {
      action = new Action(action_or_token, options);
    } else {
      action = action_or_token;
    }
    action.scope = this;
    this.actions.push(action);
    return this;
  }
  
  Scope.prototype.performAction = function(action){
    this.last_action = action;
    this.scope.performAction(action);
  }
  
  Scope.prototype.clearSelection = function(){
    this.last_action = null;
  }
    
  Scope.prototype.filter = function(query){
    if (!query) { query = ""; };
    this.query = query;
    var scored = [];
    this.actions.forEach(function(action){
      scored.push({action:action, score:action.score(query)})
    });
    scored.sort(function(a, b){
      if(a.score > b.score){
        return -1;
      } else if(b.score > a.score){
        return 1;
      } else {
        return 0;
      }
    });
    var filtered_actions = [];
    scored.forEach(function(scored_action){
      if ( scored_action.score > 0){
        filtered_actions.push(scored_action.action);
      }
    });
    if (filtered_actions.length == 0 && query != "" && !Array.isArray(query)) {
      // split the query and try again?
      filtered_actions = this.filter(query.replace(/[\s]+/,' ').split(' '))
    };
    this.current_actions = filtered_actions;
    return filtered_actions.slice();
  }
  
  Scope.prototype.currentActions = function(){
    return this.current_actions;
  }


  Launcher = Hopscotch.Launcher = function(){
      
    var launcher = this;
  
    Scope.call(this, 'Launcher');
    this.scopes = [this];
  };
  
  Launcher.prototype = Object.create(Scope.prototype);
  
  Launcher.prototype.getQuery = function(){
    return this.currentScope().query;
  }
    
  Launcher.prototype.reset = function(){
    this.scopes = [this];
    this.clearSelection();
  }

  Launcher.prototype.search = function(query){
    var scope = this.currentScope(),
        results = scope.filter(query);
    this.triggerEvent('filter', results);
    return results;
  }
  
  Launcher.prototype.isRootScope = function(){
    return this == this.currentScope();
  }
  
  Launcher.prototype.currentScope = function(){
    return this.scopes[this.scopes.length - 1];
  }

  Launcher.prototype.pushScope = function(scope){
    this.scopes.push(scope);
    scope.filter();
    this.triggerEvent('pushScope', scope);
    return this;
  }

  Launcher.prototype.popScope = function(){
    if (this.scopes.length == 1) return;
    var scope = this.scopes.pop();
    this.triggerEvent('popScope', scope);
    return scope;
  }
  
  Launcher.prototype.setup = function(){
    this.actions = [];
    this.triggerEvent('setup');
  }

  /*
    Performs the provided action
  */
  Launcher.prototype.performAction = function(action){
    if (typeof(action) == 'number' || action.constructor == Number) {
      action = this.currentScope().currentActions()[action];
    };
    var actionEvent = {
      query: this.getQuery(),
      launcher: this,
      scope: this.currentScope()
    };
    this.emit('beforeAction', action, actionEvent);
    var response = action.perform(actionEvent);
    this.emit('afterAction', action, actionEvent, response);
    if(response && typeof(response) == 'function')
      response.call(action, actionEvent.query, actionEvent.launcher);
  }

  
  var LiquidMetal = function() {
    var SCORE_NO_MATCH = 0.0;
    var SCORE_MATCH = 1.0;
    var SCORE_TRAILING = 0.8;
    var SCORE_TRAILING_BUT_STARTED = 0.9;
    var SCORE_BUFFER = 0.85;

    return {
      score: function(string, abbreviation) {
        // Short circuits
        if (abbreviation.length == 0) return SCORE_TRAILING;
        if (abbreviation.length > string.length) return SCORE_NO_MATCH;

        var scores = this.buildScoreArray(string, abbreviation);

        var sum = 0.0;
        for (var i in scores) {
          sum += scores[i];
        }

        return (sum / scores.length);
      },

      buildScoreArray: function(string, abbreviation) {
        var scores = new Array(string.length);
        var lower = string.toLowerCase();
        var chars = abbreviation.toLowerCase().split("");

        var lastIndex = -1;
        var started = false;
        for (var i in chars) {
          var c = chars[i];
          var index = lower.indexOf(c, lastIndex+1);
          if (index < 0) return fillArray(scores, SCORE_NO_MATCH);
          if (index == 0) started = true;

          if (isNewWord(string, index)) {
            scores[index-1] = 1;
            fillArray(scores, SCORE_BUFFER, lastIndex+1, index-1);
          }
          else if (isUpperCase(string, index)) {
            fillArray(scores, SCORE_BUFFER, lastIndex+1, index);
          }
          else {
            fillArray(scores, SCORE_NO_MATCH, lastIndex+1, index);
          }

          scores[index] = SCORE_MATCH;
          lastIndex = index;
        }

        var trailingScore = started ? SCORE_TRAILING_BUT_STARTED : SCORE_TRAILING;
        fillArray(scores, trailingScore, lastIndex+1);
        return scores;
      }
    };

    function isUpperCase(string, index) {
      var c = string.charAt(index);
      return ("A" <= c && c <= "Z");
    }

     function isNewWord(string, index) {
      var c = string.charAt(index-1);
      return (c == " " || c == "\t");
    }

    function fillArray(array, value, from, to) {
      from = Math.max(from || 0, 0);
      to = Math.min(to || array.length, array.length);
      for (var i = from; i < to; i++) { array[i] = value; }
      return array;
    }
  }();
     
  return Hopscotch;
  
})();
