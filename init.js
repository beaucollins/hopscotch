// only do this on top level windows, no iframes or frames
if (window.top === window) {
  
  var launcher = new Launcher();
  
  document.addEventListener('DOMContentLoaded', function(){
    
    // if theres a toolbar, then we know we're in the admin or logged in on the front end

    if(document.location.toString().match(/\/wp-admin\//)){
      
      launcher.initialize();
      
      // For repositioning the interface when browser changes
      var resize_timer;
      var resize = function(){
        clearTimeout(resize_timer)
        resize_timer = setTimeout(function(){
          launcher.taskbar.style.left = Math.max(window.innerWidth/2 -250, 0) + 'px';
          launcher.taskbar.style.top = Math.max(window.innerHeight/8, 0) + 'px';
        }, 200);
      }
      // resize once on page load
      resize();
      // resize every time we get a resize event
      window.addEventListener('resize', function(e){
        resize();
      });
      
      // For activating the search bar
      // double-tap CMD
      var lastTap = 0;
      document.addEventListener('keydown', function(e){
        if (e.keyCode != 91) return;
        var thisTap = e.timeStamp;
        if (thisTap - lastTap <= 200) {
          lastTap = 0;
          launcher.toggle();
        } else {
          lastTap = thisTap;
        }
      });
      
      // Close the launcher when anything outside the launcher is clicked
      document.addEventListener('click', function(e){
        if (launcher.state == 'open') {
          // if we didn't click inside the launcher node
          if (e.target == launcher.taskbar) {
            return;
          } else {
            var node = e.target;
            while(node = node.parentNode){
              if (node == launcher.taskbar) {
                return;
              };
            }
          }
          launcher.close();
        };
      })
      
    }
  });  
};
