require('dotenv').config();
const config = require('./config')
let appInsights = null;
if( config.disableAppInsights!=1)
{ 
  appInsights = require('applicationinsights');
}

const express = require('express');
const app = express();
const rp = require('request-promise');




app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Referrer-Policy", "unsafe-url");
  next();
});

if( config.disableAppInsights!=1)
{
  appInsights.setup().setSendLiveMetrics(true);
  appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = process.env.HOSTNAME;
  appInsights.start();
}

var htmlrequesticon = '<i class="fas fa-arrow-down"></i></br>';
var htmlusericon = '<i class="fas fa-user"></i></br>';

getClientAddress = function (req) {
    return req.connection.remoteAddress;
};


var pubdirpath=require('path').join(__dirname, 'public');
console.log("... serving " + pubdirpath);
var pubdir = express.static(pubdirpath);



app.use('/public', pubdir);

app.get('/static', (req, res) => {
    res.sendFile('static/static.html', { root: "." });
})

getHostIps = function () {
    var os = require('os');
    var nwinterface = os.networkInterfaces();
    var ips = [];
    Object.keys(nwinterface).forEach(function (nwinterfacename) {
        nwinterface[nwinterfacename].forEach(function (iface) {
            ips.push(iface.address);            
        });
    });
    return ips.toString();
}
 
// Routes
app.get('/ping', function (req, res) {
    console.log('received ping');
    res.send('Pong, Pong');
});

app.get('/api/whoareu', function (req, res) {
  console.log (Date.UTC);
    console.log("Headerinfo:");
    console.log(req.headers);

    var clientIP = getClientAddress(req);
    var addresses = getHostIps();
    if(req.query.sub==undefined)
    {
        // simple plain answer for debugging
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write("I'm ... " + config.color + " running on " + addresses);
    }
    else
    {
        // sophisticated HTML answer if
        // request comes from a cascading call and will be wrapped into html later by caller
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(createHTMLInfo(req.query.sub,"unknown",clientIP,htmlrequesticon));
    }    
    res.send();    
});

function addAI()
{
    var block = "<script type=\"text/javascript\" src=\"/public/get.js\"></script>"
    if( config.disableAppInsights!=1)
    {
      block+="<script type=\"text/javascript\" \">var aikey='"+process.env.APPINSIGHTS_INSTRUMENTATIONKEY+"'</script>";
      return block + "<script type=\"text/javascript\" src=\"/public/appinsights.js\"></script>";
    }
    else
    {
      return block;
    }
}


function addButton()
{
    // return "<button onclick=\"httpGet('http://51.104.163.255/api/cascade')\">Click me</button>";
    return "<button onclick=\"httpGet('http://dmx-apimm.azure-api.net/redgreenyellow/cascade')\">Click me</button>";
}

function addAIEvent(msg)
{
  return "";  
}

// calls next service as defined with env vars
app.get('/api/cascade', function (req, res) {


    var clientIP = getClientAddress(req);

    console.log (Date.UTC);
    console.log("Headerinfo:");    
    console.log(req.headers);

    var url = config.protocol+"://"+config.serviceendpointhost +":" +config.serviceendpointport  + config.serviceendpointpath;    

    // add query para "sub" for every subsequent query. This is used to indicate to the next called service to return a value in a useful format.
    // it is also used to indicate the position in the sequence of calls.
    var subpara = req.query.sub;
    var currentposition = undefined;
    if (subpara == undefined) {
        currentposition = 0;
    }
    else
    {
        currentposition = parseInt(subpara);
    }
    url = url + "?sub=" + (currentposition + 1);

    console.log("start cascading... " + url);

    // console.log(req.headers);

    // call next service
    var o= {
    headers: {
        /* propagate the dev space routing header */
        'kubernetes-route-as': req.headers['kubernetes-route-as'],
        'custom-header': 'custom'+ Date.now()
     }
    }

    // console.log("route-as: "+ req.headers['kubernetes-route-as']);
    rp.get(url,o)
        .then(function (data) {
            console.log("Data received from ... " +url);          
            
            // now create the answer.
            // first part of answer is info about this service
            var html = createHTMLInfo(currentposition, url, clientIP, htmlrequesticon);

            // pass on header for azds
            var azdsroute=req.headers['kubernetes-route-as']; 

            if (currentposition > 0) {
                // contenttype will be defined by wrapping call
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                // second part of answer is the answer we got from the subsequent call - wrapped in a way that it doesn't break our html
                res.write(html + wrapdata(data));
            }
            else {
                // first call hits here

                // html head for presentation of results
                var htmlhead = "" +
                    "<html>" +
                    "<head>" +
                    
                    addAI() +
                    addAIEvent("'cascade'" )+

                    "<link rel=\"stylesheet\" href=\"https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css\" integrity=\"sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh\" crossorigin=\"anonymous\">" +
                    "<style>" +
                    "canvas {float: left;width:100px;height:100px; }" +
                    'i {font-size:100px;}' +
                    "p.clear {clear: both; margin-left: 5px;}" +
                    'p.info {margin-left: 120px;}' +
                    "</style>" +
                    '<script src="https://kit.fontawesome.com/a076d05399.js"></script>' +
                    "</head>" +
                    "<body>" +
                    addButton()+
                    "<h1>Cascading API calls</h1>";                
                var htmlend = "</body></html>";
              
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(htmlhead + htmlusericon + html + wrapdata(data) + htmlend);
            }
            res.send();            
        });
});

// helper to provide fancy ui
function createHTMLInfo(currentposition, url, clientIP, htmlrequesticon) {
    var htmlcontent = "<p class=clear >";
    var canvas = '<canvas style="border:1px;background-color:' + config.color + ';"></canvas>';
    var info = '<p class=info>' +
        'Color : ' + config.color + '</br>' +
        'Position : ' + currentposition + '</br>' +
        'IP: ' + getHostIps() + '</br>' +
        'Getting data from: ' + url + '</br>' +
        'Caller IP: ' + clientIP + '</br>' +
        
        '</p>';
    var htmlcontentend = '</p>';
    var html = htmlrequesticon + htmlcontent + canvas + info + htmlcontentend;
    return html;
}

function wrapdata(datastring)
{
    return '<p style="clear:both">'+datastring+'</p>';
}



app.get('/', function (req, res) {
    var clientIP = getClientAddress(req);
    var addresses = getHostIps();
    res.writeHead(200, { 'Content-Type': 'text/html' });

    tabs = "\t\t";

    res.end('<html><head>'+addAI()+'Hello'+'</head> +<body bgcolor=' + config.color + '><h1>DebugContainer</h1>' +
        "<p>Make sure you started this container as described <a href=\"https://github.com/DanielMeixner/DebugContainer\">here</a>. </p>" +
        "<p>You can start this container multiple times locally. Make sure you provide your docker bridge gateway IP as SERVICEENDPOINTHOST.</p>" +

        "<p>Get <a href=\"/api/cascade\">/api/cascade</a> to query serviceendpoint1 + serviceendpointpath + serviceendpointport.</p>" +
        "SERVICEENDPOINTHOST=" + tabs + config.serviceendpointhost + "</br>" +
        "SERVICEENDPOINTPATH=" + tabs + config.serviceendpointpath + "</br>" +
        "SERVICEENDPOINTPORT=" + tabs + config.serviceendpointport + "</br>" +

        "Port=" + tabs + config.port + "</br>" +
        "Color=" + tabs + config.color + "</br>" +
        "ClientIP=" + tabs + clientIP + "</br>" +
        "ServerIP=" + tabs + addresses + "</br>" +
        "myvar=" + tabs + config.myvar + "</br>" +
        "bla=" + tabs + config.myvar + "</br>" +
        ""
    );
});

app.listen(config.port);
console.log("running & listening on " + config.port)

