var http = require("http");
var pg = require("pg");


http.createServer(function(request, response) {
  //response.writeHead(200, {"Content-Type": "text/plain"});
  if (request.url === '/favicon.ico') {
    response.writeHead(200, {'Content-Type': 'image/x-icon'} );
    response.end();
    //console.log('favicon requested');
    return;
  }else{ 
    response.writeHead(200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "X-Requested-With"
    });
    var dt=request.url.match(/^\/[^?]+/);
    if(!dt){
      dt="pqiVarChar"
    }else{
      dt=dt[0].slice(1);
      console.log('dt: '+dt);
    }
    var parms=request.url.match(/\?.+/);
    if(parms){
      parms=parms[0].slice(1)
      console.log('parms: '+parms)
    }
    var conString = "pg://uname:password@localhost:5432/DataBaseName";
    // Assync pg starts here
    pg.connect(conString, function(err, client, done) {
      if(err) {
        return console.error('error fetching client from pool', err);
      }
      var q = "SELECT * FROM "+dt;
      if(parms){
        // extract soda 2 attributes
        var s2m = parms.match(/\$[^=]+=[^&]+/g);
        var s2='';
        if(s2m){
          parms=parms.replace(/&*\$[^=]+=[^&]+&*/g,'').replace(/&+/g,'&'); // remove soda2 parms
          s2m.forEach(function(si){
            s2+=si.replace(/[$=]/g,' ');
          })
        }
        s2+=';';
        if(parms.length>0){
          q+=" WHERE "+parms.replace(/=([^\&]+)/g," LIKE '$1'").replace(/%3E/g,">").replace(/%3C/g,"<").replace(/&/g," AND ")
        }
        q+=s2;
      }
      console.log('SQL: ',q)
      client.query(q, function(err, result) {
        //call `done()` to release the client back to the pool 
        done();
    
        if(err) {
          //console.error('error running query:', err);
          response.end(JSON.stringify(err, null, "    "));
          response.end();
        } else {
          response.end(JSON.stringify(result.rows, null, "    "));
          //response.end();
        }
        //console.log(result.rows[0].number);
        
        //output: 1 
      });
    });
  }}).listen(3000);