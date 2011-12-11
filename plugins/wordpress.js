if (launcher && launcher.constructor == Launcher) {
  launcher.addEventListener('setup', function(event){
    
    // Add an Action for each link in the side navigation
    $('#adminmenu a').each(function(){
      var $this = $(this);
      var label = $this.text();
      var section = $this.parents('li.wp-has-submenu').eq(0).find('.wp-has-submenu').eq(0).text().trim();
      
      if (label.trim() != "") {
        launcher.root.addAction(label + " " + section, {
          onPerform: function(query, launcher){
            window.location = $this.attr('href');
          },
          onAutocomplete: function(){
            return label;
          },
          onHTML: function(){
            return "<strong>" + label + "</strong>" + "<small>" + section + "</small>";
          }
        })
      };
      
    })
    
    var admin_url = window.location.toString().replace(/^(.*\/wp-admin\/).*$/, '$1');

    var searches = [
      { token: 'Search Blog:',        url:$('#adminbarsearch').attr('action') + "?s=%QUERY%"},
      { token: 'Search Posts:',       url:admin_url + 'edit.php?s=%QUERY%' },
      { token: 'Search Categories:',  url:admin_url + 'edit-tags.php?taxonomy=category&s=%QUERY%' },
      { token: 'Search Tags:',        url:admin_url + 'edit-tags.php?taxonomy=post_tag&s=%QUERY%' },
      { token: 'Search Media:',       url:admin_url + 'upload.php?s=%QUERY%' },
      { token: 'Search Pages:',       url:admin_url + 'edit.php?s=%QUERY%&post_type=page' },
      { token: 'Search Comments:',    url:admin_url + 'edit-comments.php?s=%QUERY%' }
    ];
    
    
    searches.forEach(function(search){
      launcher.root.addAction(search.token, {
        onHTML: function(query){
          var s = "";
          if (query.indexOf(":") > -1) {
            s = " <em>" + query.match(/^[^:]{0,}:(.*)/)[1] + "</em>";
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
        onPerform: function(query){
          window.location = search.url.replace('%QUERY%', query.match(/^[^:]+?:(.*)/)[1].trim());
        }
      });
    });
    
    launcher.root.addAction('Spin Me', {
      preventLaunch: true,
      onHTML: function(){
        return "<strong>I dare you!</strong> <span style=\"-webkit-transform:rotateZ(180deg)\">You win!</span>";
      },
      onPerform: function(){
        if (!this.rotate) {
          this.rotate = 180;
        } else {
          this.rotate += 180;
        }
        launcher.taskbar.style.webkitTransform = 'rotateZ(' + this.rotate + 'deg)';
      },
      onScore: function(query){
        return query.toUpperCase() == this.token.toUpperCase() ? 1 : 0;
      }
    });
    
    
  });
};