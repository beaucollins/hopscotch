if (launcher && launcher.constructor == Launcher) {
  launcher.addEventListener('setup', function(event){
    
    var in_admin = window.location.toString().match(/\/wp-admin\//);
    
    // Add an Action for each link in the side navigation
    $('#adminmenu a').each(function(){
      var $this = $(this);
      var link = this;
      var label = $this.text().trim();
      var section = $this.parents('li.wp-has-submenu').eq(0).find('.wp-has-submenu');
      if (section.is(this)){
        section = "";
      } else {
        section = section.text().trim();
      }
      
      if (label.trim() != "") {
        launcher.root.addAction( (label + " " + section).trim(), {
          onPerform: function(actionEvent){
            return {
              callback:function(){
                window.location = $this.attr('href');
              }
            }
          },
          onAutocomplete: function(){
            return label;
          },
          onHTML: function(){
            return "<strong>" + label + "</strong> <small>" + section + "</small>";
          }
        })
      };
      
    })
    
    
    var searches = []
    // only present in the admin
    if ($('#adminmenu').length > 0) {
      
      var admin_url = window.location.toString().replace(/^(.*\/wp-admin\/).*$/, '$1');
      searches = searches.concat([
        { token: 'Search Posts:',       url:admin_url + 'edit.php?s=%QUERY%' },
        { token: 'Search Categories:',  url:admin_url + 'edit-tags.php?taxonomy=category&s=%QUERY%' },
        { token: 'Search Tags:',        url:admin_url + 'edit-tags.php?taxonomy=post_tag&s=%QUERY%' },
        { token: 'Search Users:',       url:admin_url + 'users.php?s=%QUERY%' },
        { token: 'Search Media:',       url:admin_url + 'upload.php?s=%QUERY%' },
        { token: 'Search Pages:',       url:admin_url + 'edit.php?s=%QUERY%&post_type=page' },
        { token: 'Search Comments:',    url:admin_url + 'edit-comments.php?s=%QUERY%' }
      ]);
    
    }
    
    if ($('#adminbarsearch').length > 0) {
      searches.unshift({ token: 'Search Blog:', url:$('#adminbarsearch').attr('action') + "?s=%QUERY%"})
    };
    
    searches.forEach(function(search){
      launcher.root.addAction(search.token, {
        onHTML: function(query){
          var s = "";
          if (query.indexOf(":") > -1) {
            s = " <em>" + query.match(/^[^:]{0,}: ?(.*)/)[1] + "</em>";
          }
          return "<strong>" + search.token + s + "</strong>";
        },
        onScore: function(query){
          if (query.indexOf(":") > -1) {
            return Action.score(search.token, query.match(/^[^:]{0,}/)[0])
          } else {
            return Action.score(search.token, query);
          }
        },
        onAutocomplete:function(query){
          return search.token + " ";
        },
        onPerform: function(actionEvent){
          var query;
          if (query = actionEvent.query.match(/^[^:]{0,}:(.*)/)){
            s = query[1].trim();
            return {
              preventLaunch: s == "",
              callback:function(query){
                if (s != "") {
                  window.location = search.url.replace('%QUERY%', s);                  
                };
              }
            };
          } else {
            return {
              preventLaunch: true,
              callback:function(){
                actionEvent.launcher.autocompleteAction();
              }
            }
          }
        }
      });
    });
    
    launcher.root.addAction('Spin Me', {
      onHTML: function(){
        return "<strong>I dare you!</strong> <span style=\"-webkit-transform:rotateZ(180deg)\">You win!</span>";
      },
      onPerform: function(actionEvent){
        return {
          preventLaunch: true,
          callback:function(){
            if (!this.rotate) {
              this.rotate = 180;
            } else {
              this.rotate += 180;
            }
            launcher.taskbar.style.webkitTransform = 'rotateZ(' + this.rotate + 'deg)';
          }
        };
      },
      onScore: function(query){
        return query.toUpperCase() == this.token.toUpperCase() ? 1 : 0;
      }
    });
    
    
  });
};