if (window.top === window) {

var Launcher = function(){
  
  EventEmitter.apply(this);
  
}

Launcher.prototype.initialize = function(parentNode){
  var launcher = this;
  
  var input = this.input = document.createElement('input'),
      taskbar = this.taskbar = document.createElement('wplauncher'),
      root = this.root = new Scope(),
      scope = this.scope = [root],
      results = this.results = document.createElement('wplauncher-results'),
      result_list = this.result_list = document.createElement('wplauncher-result-list');
  
  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', "Type…");
  
  taskbar.style.display = 'none';
  
  taskbar.appendChild(input);
  taskbar.appendChild(results);
  results.appendChild(result_list);
  
  taskbar.addEventListener('webkitTransitionEnd', function(e){
    if (e.propertyName != '-webkit-transform') return;
    if (launcher.state == 'closing' || launcher.state == 'launching') {
      launcher.state = 'closed';
      launcher.taskbar.style.display = 'none';
      launcher.reset();
    } else if (launcher.state == 'opening') {
      launcher.state = 'open';
    }
  });
  
  // intercept TAB/ENTER/UP/DOWN and CTRL+0..9
  input.addEventListener('keydown', function(e){
    if (e.which == 27) { // ESCAPE
      e.preventDefault();
      input.value = "";
      input.blur();
      if (launcher.state != 'closed' ) {
        launcher.close();        
      };
      return
    } else if (e.which == 40){ //DOWN
      e.preventDefault();
      launcher.highlightNextAction();
      return;
    } else if(e.which == 38){ //UP
      e.preventDefault();
      launcher.highlightPreviousAction();
      return;
    } else if (e.which == 13){ // RETURN
      e.preventDefault();
      launcher.performHighlightedAction();
      return;
    } else if (e.which == 9){ // TAB
      e.preventDefault();
      launcher.autocompleteAction();
      return;
    } else if(e.ctrlKey && 48 <= e.which && 57 >= e.which){
      e.preventDefault();
      var index = e.which == 48 ? 9 : e.which - 49;
      launcher.highlightAction(index);
      launcher.performHighlightedAction();
      return;
    }
  });
  
  var last_query = "";
  
  // perform the filtering based on the input value
  input.addEventListener('keyup', function(e){
    if (input.value == "") {
      last_query = input.value;
      launcher.displayActions([]);
      return;
    };
    if (last_query != input.value) {
      last_query = input.value;
      var filtered_actions = launcher.filter();

      // display the actions
      launcher.displayActions(filtered_actions);
    };
    
  });
  
  result_list.addEventListener('click', function(e){
    var action_node = e.target;
    do {
      if (action_node.nodeName == 'WPLAUNCHER-ACTION') {
        launcher.performAction(action_node.action);
        break;
      };
    } while(action_node = action_node.parentNode);
  });
  
  
  if (!parentNode) parentNode = document.body;
  parentNode.appendChild(taskbar);
  
  this.state = 'closed';
  
  this.triggerEvent('setup');
  
}

Launcher.prototype.displayActions = function(actions){
  // construct a new node each time?
  var scope = this.currentScope();
  this.clearResults();
  
  actions.forEach(function(action){
    var node = document.createElement('wplauncher-action');
    node.action = action;
    node.innerHTML = action.getHtml(this.input.value);
    this.result_list.appendChild(node);
    if (scope.highlightedAction == action) {
      node.setAttribute('highlighted', 'yes');
    };
  }, this)
  
  if (actions.length == 0) {
    this.results.style.height = "0"
  } else {
    this.results.style.height = this.result_list.offsetHeight + 'px';
  }
  
  if (!this.highlightedNode()) {
    this.highlightAction(0);
  };
  
  
}

Launcher.prototype.reset = function(){
  this.clearResults();
  this.input.value = "";
  this.scope = [this.root];
}

Launcher.prototype.clearResults = function(){
  this.result_list.innerHTML = "";
}

Launcher.prototype.filter = function(){
  var scope = this.currentScope();
  var query = this.input.value;
  // var actions = scope.actions.slice(0);
  return scope.filterActions(query);

}

Launcher.prototype.currentScope = function(){
  return this.scope[this.scope.length - 1];
}

Launcher.prototype.pushScope = function(scope){
  this.scope.push(scope);
  return this;
}

Launcher.prototype.popScope = function(){
  return this.scope.pop();
}

/*
 Display the launcher interface
*/
Launcher.prototype.open = function(){
  this.state = 'opening';
  var launcher = this;
  this.taskbar.style.webkitTransform = "scale3d(1,0,1)";
  this.taskbar.style.webkitTransitionDuration = '200ms';
  this.taskbar.style.display = "block";
  this.taskbar.style.opacity = "0.95";
  setTimeout(function(){
    launcher.input.focus();
    launcher.taskbar.style.webkitTransform = "scale3d(1,1,1)";
  })
  
}

/*
 Hide the launcher interface
*/
Launcher.prototype.close = function(){
  this.state = 'closing';
  this.taskbar.style.webkitTransitionDuration = '175ms';
  this.taskbar.style.webkitTransform = "scale3d(1,0,1)";
  this.taskbar.style.opacity = "0";
}

Launcher.prototype.toggle = function(){
  if (this.state == 'closed') {
    this.open();
  } else if (this.state == 'open') {
    this.close();
  }
}

Launcher.prototype.highlightedNode = function(){
  return this.result_list.querySelector("[highlighted]");
}

Launcher.prototype.highlightNode = function(node){
  var highlighted,
      scope = this.currentScope();
  if (highlighted = this.highlightedNode()) {
    highlighted.removeAttribute('highlighted');
  };
  if (node) {
    scope.highlightedAction = node.action;
    node.setAttribute('highlighted', 'yes');
  } else {
    scope.highlightedAction = null;
  }
}

Launcher.prototype.highlightAction = function(index){
  this.highlightNode(this.result_list.childNodes[index]);
}

Launcher.prototype.highlightNextAction = function(){
  // find the one that is highlighted
  var highlighted = this.highlightedNode();
  if (highlighted && highlighted.nextElementSibling) {
    this.highlightNode(highlighted.nextElementSibling);
  } else {
    this.highlightNode(this.result_list.firstChild);
  }
}

Launcher.prototype.highlightPreviousAction = function(){
  var highlighted = this.highlightedNode();
  if (highlighted && highlighted.previousElementSibling) {
    this.highlightNode(highlighted.previousElementSibling);
  } else {
    this.highlightNode(this.result_list.lastChild);
  }
}

Launcher.prototype.performHighlightedAction = function(){
  var highlighted = this.highlightedNode();
  if (highlighted && highlighted.action) {
    this.performAction(highlighted.action);
  };
}

/*
  Performs the highlighted action
*/
Launcher.prototype.performAction = function(action){
  var actionEvent = {
    query: this.input.value,
    preventLaunch: false,
    launcher: this
  }
  var callback = action.perform(actionEvent);
  if (actionEvent.preventLaunch !== true) {
    this.state = 'launching';
    this.taskbar.style.webkitTransform = 'scale3d(2,2,1)';
    this.taskbar.style.opacity = '0';
    setTimeout(function(){
      callback.apply(action, [actionEvent.query, actionEvent.launcher]);
    })
  } else {
    callback.apply(action, [actionEvent.query, actionEvent.launcher]);
  }
}
/*
  Autocompletes based on the currently highlighted item
*/
Launcher.prototype.autocompleteAction = function(){
  var highlighted = this.highlightedNode();
  if (highlighted && highlighted.action) {
    this.input.value = highlighted.action.autocomplete(this.input.value);
  };
}

/* A scope provides the context that the current search is being performed on */
var Scope = function(){
  var actions = this.actions = [];
}

Scope.prototype.addAction = function(action_or_token, options){
  var action = action_or_token.constructor == Action ? action_or_token : new Action(action_or_token, options)
  this.actions.push(action);
  return this;
}

Scope.prototype.filterActions = function(query){
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
    if ( scored_action.score > 0) filtered_actions.push(scored_action.action);
  })
  return filtered_actions.slice(0,10);
  
}

/*
An action is a single line item that will be presented in the filtered list
Provides the token to filter on, what to display in the list and how to handle
requests for autocompletion.
*/
var Action = function(token, options){
  if(!options) options = {};
  this.token = token;
  this.options = {
    onScore: options.onScore || function(query){ return Action.score(this.token, query) },
    onAutocomplete : options.onAutocomplete || function(query){ return this.token; },
    onPerform : options.onPerform || function(){ throw("No Action defined for: " + this.token) },
    onHTML: options.onHTML || function(){ return "<strong>" + token + "</strong>" },
    preventLaunch: options.preventLaunch === true ? true : false
  }
  
}

/*
Default scoring is the LiquidMetal score based on the Action's token
*/
Action.prototype.score = function(query){
  return this.options.onScore.call(this, query);
}

/* basd on the currenty query, return what is provided for automplete */
Action.prototype.autocomplete = function(query){
  return this.options.onAutocomplete.call(this, query);
}

Action.prototype.perform = function(actionEvent){
  actionEvent.preventLaunch = this.options.preventLaunch;
  return this.options.onPerform;
}

Action.prototype.getHtml = function(query){
  return this.options.onHTML.call(this, query);
}

Action.score = function(token, query){
  return LiquidMetal.score(token, query);
}

var EventEmitter = function(){
  
  var listeners = {}
  
  this.addEventListener = function(eventName, callback){
    if(!listeners[eventName]) listeners[eventName] = [];
    listeners[eventName].push(callback);
  }
  
  this.triggerEvent = function(eventName){
    var eventListeners = listeners[eventName];
    for (var i=0; i < eventListeners.length; i++) {
      eventListeners[i].apply(null, [{
        name: eventName,
        target: this
      }].concat(Array.prototype.slice.call(arguments, 1)));
    };
  }
}


}