function httpGet(theUrl)
{  
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, true ); // false for synchronous request
    xmlHttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
       alert(xmlHttp.responseText)
      }
  };
    xmlHttp.send( null );
    
 
    
    
}