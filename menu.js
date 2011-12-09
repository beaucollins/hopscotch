(function($){
  
  if (document.location.pathname.match(/\/wp-admin\//) && document.getElementById('wpwrap')) {
    // more than likely wordpress admin
    
    var menu_node = document.createElement('div');
    menu_node.setAttribute('id', 'wpmenu-redimastudio-taskbar');
    menu_node.innerHTML = "<input id=\"wpmenu-redimastudio-searchfield\" placeholder=\"Type&hellip;\" type=\"text\">";
    
    document.body.appendChild(menu_node);
    
    var taskbar = document.getElementById('wpmenu-redimastudio-taskbar');
    var input = taskbar.querySelector('input#wpmenu-redimastudio-searchfield');
    var results = document.createElement('div')
    results.setAttribute('id', 'wpmenu-redimastudio-results')
    var result_list = document.createElement('ul');
    results.appendChild(result_list);
    var highlighted;
    
    var positionTaskbar = function(){
      var x = (document.body.offsetWidth - taskbar.offsetWidth)/2 + 'px'
          y = Math.max((document.body.offsetHeight - taskbar.offsetHeight)/2 - 175, 0) + 'px';
          
      taskbar.style.left = x;
      taskbar.style.top = y;
    }
    
    window.addEventListener('resize', function(){
      positionTaskbar();
    });
    
    taskbar.appendChild(results);
    positionTaskbar();
    
    var actions = [];
    
    var links = document.querySelectorAll('[role="navigation"]#adminmenu a');
    for (var i=0; i < links.length; i++) {
      var link = links[i], $link = $(link);
      var label = link.textContent.trim();
      var display = "";
      var section, display_labels = [];
      if (label != "") {
        section = $link.parents('li.wp-has-submenu').eq(0).find('.wp-has-submenu').eq(0).text().trim();
        if(section != "") display_labels.push(section);
        if(section != label) display_labels.push(label);
        label = display_labels.slice(0).reverse().join(' ');
        var last = display_labels.pop();
        var prefix = display_labels.length > 0 ? "<small>" + display_labels.join("</small> <span>&#x25B8;</span> <small>") + "</small> <span>&#x25B8;</span> " : "" ;
        var node = document.createElement('li');
        node.innerHTML = prefix + "<strong>" + last + "</strong>";
        
        var action = {
          label:label,
          link: link.getAttribute('href'),
          node: node
        }
        node.action = action;
        actions.push(action)
      };
    };
    
    var last = "";
    
    input.addEventListener('keydown', function(e){

      if (e.which == 27) {
        input.value = "";
        return;
      };
      
      if (e.which == 40){
        //down
        e.preventDefault();
        var next;
        if(highlighted) next = highlighted.next();
        if(next.is('li')){
          highlighted.attr('highlighted', null);
          highlighted = next.attr('highlighted', true);
        }
        return;
      } else if(e.which == 38){
        //up
        e.preventDefault();
        var prev;
        if(highlighted) prev = highlighted.prev();
        if(prev.is('li')){
          highlighted.attr('highlighted', null);
          highlighted = prev.attr('highlighted', true);
        }
        
        return;
      }
    });
    
    input.addEventListener('keyup', function(e){
      e.stopPropagation();
      // copy the array then sort by fuzzy match
      var current = input.value;
      var c = String.fromCharCode(e.charCode)
      if (last == current) return;
      last = current;
      result_list.innerHTML = "";
      if (current == ""){
        results.style.height = "0px";
        return;
      }
      var search_string = current;
      var sorted = actions.slice(0).sort(function(a, b){
        var score_a = a.score = LiquidMetal.score(a.label, search_string);
        var score_b = b.score = LiquidMetal.score(b.label, search_string);
        
        if (score_a > score_b) {
          return -1;
        } else if(score_b > score_a ) {
          return 1;
        } else {
          return 0;
        }
      })
      // show the top 10 results
      sorted.slice(0,10).forEach(function(item, index, items){
        // reload the results field
        if(item.score <= 0) return;
        result_list.appendChild(item.node);
        
      });
      if(result_list.childNodes.length == 0 ) {
        results.style.height = '0px';
        return;
      }
      
      results.style.height = result_list.offsetHeight + 'px';
      if(highlighted) highlighted.attr('highlighted',null);
      highlighted = $(result_list).find('li:first-child').attr('highlighted','true')
      
    })
    
    
  };
  
})(jQuery);

