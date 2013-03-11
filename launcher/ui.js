window.Hopscotch.ui = (function(Hopscotch, $){
  // Build's the HTML interface to the Hopscotch Launcher
  var EventEmitter = Hopscotch.EventEmitter, UI;
  // Main interface implementation for HTML
  UI = Hopscotch.UI = function(doc, launcher){
    Hopscotch.EventEmitter.apply(this);
    // reference to html document
    this.doc = doc;
    // reference to the main launcher
    this.launcher = launcher;
  };
  // Inherit from EventEmitter
  UI.prototype = Object.create(Hopscotch.EventEmitter.prototype);
  UI.prototype.autocomplete = function(){
    var item = this.getHighlightedItem();
    if (item && item.action) {
      return item.action.autocomplete();
    };
  };
  UI.prototype.launch = function(){
    this.state = 'launching';
    this.taskbar.style.webkitTransform = 'scale(2,2)';
    this.taskbar.style.opacity = '0';
    this.launcher.reset();
    this.input.value = '';
  };
  UI.prototype.setScope = function(scope){
    var bar = this.scope_bar;
    if (scope == this.launcher) {
      bar.innerHTML = "";
      bar.style.display = 'none';
    } else {
      bar.innerHTML = scope.title;
      bar.style.display = 'block';
    }
  }
  UI.prototype.performAction = function(node){
    if (typeof(node) == 'number') {
      node = this.result_list.childNodes[node];
    };
    if (node && node.action) node.action.execute();
  };
  UI.prototype.performHighlightedAction = function(){
    this.performAction(this.getHighlightedItem());
  };
  UI.prototype.getHighlightedItem = function(){
    return this.result_list.querySelector('[data-highlighted]');
  };
  UI.prototype.highlightNextItem = function(){
    var next;
    if (this.hasHighlightedItem()) {
      next = this.getHighlightedItem().nextSibling;
    }
    if (!next) next = this.result_list.childNodes[0];
    if (next) this.setHighlightedItem(next);
  };
  UI.prototype.highlightPreviousItem = function(){
    var prev;
    if (this.hasHighlightedItem()) {
      prev = this.getHighlightedItem().previousSibling;
    }
    if (!prev) prev = this.result_list.childNodes[this.result_list.childNodes.length-1];
    if (prev) this.setHighlightedItem(prev);
  };
  UI.prototype.setHighlightedItem = function(item){
    // if it's a number then find the element, otherwise
    if (typeof(item) == 'number') {
      item = this.result_list.childNodes[item];
    };
    if (!item || item != this.getHighlightedItem()) {
      this.clearHighlightedItem();
    };
    if (item) {
      item.setAttribute('data-highlighted',true);
    };
  };
  UI.prototype.clearHighlightedItem = function(){
    if (this.hasHighlightedItem()) {
      this.getHighlightedItem().removeAttribute('data-highlighted');
    };
  };
  UI.prototype.hasHighlightedItem = function(){
    return this.getHighlightedItem() != null;
  };
  UI.prototype.highlightFirstItem = function(){
    this.setHighlightedItem(0);
  };
  UI.prototype.clearResults = function(){
    while(this.result_list.childNodes.length > 0) {
      this.result_list.removeChild(this.result_list.firstChild);
    };
  };
  UI.prototype.displayResults = function(results){
    var list = this.result_list, doc = this.doc;
    this.clearResults();
    results.forEach(function(action){
      var node = doc.createElement('wplauncher-action');
      node.action = action;
      node.innerHTML = action.getHtml();
      list.appendChild(node);
    });
    this.results.style.height = results.length > 0 ? list.offsetHeight + 'px' : "0";
    this.highlightFirstItem();
  }
  // Show/Hide the launcher
  UI.prototype.toggle = function(){
    if (this.state == 'closed') {
      this.open();
    } else if (this.state == 'open') {
      this.close();
    }
  };
  UI.prototype.open = function(){
    var that = this, bar = this.taskbar;
    this.state = 'opening';
    bar.style.webkitTransform = "scale(1,0)";
    bar.style.webkitTransitionDuration = "200ms";
    bar.style.display = "block";
    bar.style.opacity = "0.95";
    setTimeout(function(){
      bar.style.webkitTransform = null;
    });
  };
  UI.prototype.close = function(){
    this.state = 'closing';
    this.taskbar.style.webkitTransitionDuration = '175ms';
    this.taskbar.style.webkitTransform = "scale(1,0)";
    this.taskbar.style.opacity = "0";
  };
  UI.prototype.hasActions = function(){
    return this.getActionCount() > 0;
  };
  UI.prototype.getActionCount = function(){
    return this.launcher.actions.length;
  };
  UI.prototype.addAction = function(){
    this.launcher.addAction.apply(this.launcher, arguments);
    return this;
  };
  /*
   * Sets up the HTML elements and events to use
   */
  UI.prototype.initialize = function(){
    var control = this,
        // the main hopscotch scope
        launcher = this.launcher,
        doc = this.doc,
        // the field the user types into
        input = this.input = doc.createElement('input'),
        // the custom element
        taskbar = this.taskbar = doc.createElement('wplauncher'),
        // where search results are displayed
        results = this.results = doc.createElement('wplauncher-results'),
        // the actual list used to display the results
        result_list = this.result_list = doc.createElement('wplauncher-result-list'),
        // the UI that shows the current scope
        scope_bar = this.scope_bar = doc.createElement('wplauncher-scope');
    // set the input field as type="text"
    input.setAttribute('type', 'text');
    // hide the taskbar and scope bar
    taskbar.style.display = 'none';
    scope_bar.style.display = 'none';
    // append the ui elements to the taskbar container
    taskbar.appendChild(input);
    taskbar.appendChild(scope_bar);
    taskbar.appendChild(results);
    results.appendChild(result_list);
    // transition listener for flipping to a preferences view
    taskbar.addEventListener('webkitTransitionEnd', function(e){
      if (e.propertyName != '-webkit-transform') return;
      if (control.state == 'closing' || control.state == 'launching') {
        control.state = 'closed';
        taskbar.style.display = 'none';
        taskbar.style.webkitTransform = null;
      } else if (control.state == 'opening') {
        control.state = 'open';
        input.focus();
      }
    });
    // intercept TAB/ENTER/UP/DOWN and CTRL+0..9
    input.addEventListener('keydown', function(e){
      if (e.which == 27) { // ESCAPE
        e.preventDefault();
        if (control.state != 'closed') {
          input.value = "";
          control.close();
          launcher.reset();
        };
        return
      } else if (e.which == 40){ //DOWN
        e.preventDefault();
        // select the next item
        control.highlightNextItem();
        return;
      } else if(e.which == 38){ //UP
        e.preventDefault();
        if (e.metaKey) {
          // pop a scope
          launcher.popScope();
        } else {
          // move up an item the list
          control.highlightPreviousItem();
        }
        return;
      } else if (e.which == 13){ // RETURN
        e.preventDefault();
        // launch selected item
        control.performHighlightedAction();
        return;
      } else if (e.which == 9){ // TAB
        e.preventDefault();
        // autocomplete
        if (control.hasHighlightedItem()) {
          input.value = control.autocomplete()
        };
        return;
      } else if(e.ctrlKey && 48 <= e.which && 57 >= e.which){ // 0-9 with .ctrlKey
        e.preventDefault();
        var index = e.which == 48 ? 9 : e.which - 49;
        // shortcut to select items 0-9 in the list
        control.performAction(index);
        return;
      }
    });
    // store the query value between uses
    var last_query;
    launcher
      .on('filter', function(event, results){
        // clear out the results
        control.displayResults(results.slice(0,9));
      })
      .on('pushScope', function(event, scope){
        control.setScope(scope);
        input.value = last_query = '';
        last_query = '';
        launcher.search();
      })
      .on('popScope', function(event, scope){
        control.setScope(launcher.currentScope());
        input.value = launcher.getQuery();
      })
      .on('afterAction', function(event, action, actionEvent, response){
        if (!response) {
          control.launch();          
        };
      });
    // listen for when query has been changed
    input.addEventListener('keyup', function(e){
      var query;
      if (last_query != input.value) {
        // search the actions
        query = last_query = input.value;
        launcher.search(query);
      };
    });
    // a line item has been clicked
    result_list.addEventListener('click', function(e){
      var action_node = e.target;
      // climb the node until we find a <wplauncher-action> node
      do {
        if (action_node.nodeName == 'WPLAUNCHER-ACTION') {
          e.preventDefault();
          e.stopPropagation();
          launcher.performAction(action_node.action);
          break;
        };
      } while(action_node = action_node.parentNode);
    });
    // click the scope bar to go up a  scope
    scope_bar.addEventListener('click', function(e){
      // pop a scope and reset the input to previous scope
      e.preventDefault();
      launcher.popScope();
    });
    // append the UI to specified parentNode
    var parentNode = this.doc.body;
    parentNode.appendChild(taskbar);
    // starting state is closed
    this.state = 'closed';
    // trigger setup
    this.triggerEvent('setup');
  };
  return new UI(this.document, new Hopscotch.Launcher());
      
}).call(this, Hopscotch, jQuery);
