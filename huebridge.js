/**
 * Created by todd on 10/21/2015.
 */
exports.start = function(callback){
var dgram = require('dgram');
var apihttp = require("http");
var client = dgram.createSocket('udp4');
var os = require('os');
var interfaces = os.networkInterfaces();
var addresses = [];
for (k in interfaces) {
    for (k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family == 'IPv4' && !address.internal) {
            addresses.push(address.address)
        }
    }
}
var myuri = addresses[0];
console.log('My IP Address is: ' + myuri);

var hue = {};
hue.groups ={};
hue.config={};
hue.config.ipaddress=myuri;
hue.config.ipport = "80"; // other ports dont seem to be supported by smarthings
//hue.config.name="Philips hue";
//hue.config.mac="A0:36:9F:12:89:79";
//hue.config.dhcp = true;
//
//hue.config.netmask="255.255.255.0";
//hue.config.gateway = "10.6.1.1";
//hue.config.proxyaddress = '';
//hue.config.proxyport = 0;
hue.schedules={};
///
hue.lights={};
hue.lights[1]={};
hue.lights[1].state={};
hue.lights[1].state.reachable = true;
hue.lights[1].state.on = true;
hue.lights[1].state.bri = 0;
hue.lights[1].state.hue = 0;
hue.lights[1].state.sat = 0;
hue.lights[1].type = "Extended color light";
hue.lights[1].name = "Hue Lamp 1";
hue.lights[2]={};
hue.lights[2].state={};
hue.lights[2].state.reachable = true;
hue.lights[2].state.on = true;
hue.lights[2].state.bri = 0;
hue.lights[2].state.hue = 0;
hue.lights[2].state.sat = 0;
hue.lights[2].type = "Extended color light";
hue.lights[2].name = "Huebert";
hue.lights[3]={};
hue.lights[3].state={};
hue.lights[3].state.reachable = true;
hue.lights[3].state.on = true;
hue.lights[3].state.bri = 0;
hue.lights[3].state.hue = 0;
hue.lights[3].state.sat = 0;
hue.lights[3].type = "Extended color light";
hue.lights[3].name = "Hue are great";
hue.lights[4]={};
hue.lights[4].state={};
hue.lights[4].state.reachable = true;
hue.lights[4].state.on = true;
hue.lights[4].state.bri = 111;
hue.lights[4].state.hue = 0;
hue.lights[4].state.sat = 0;
hue.lights[4].type = "Extended color light";
hue.lights[4].name = "Huey Dewy Lewy";

//hue.lights[4].state.xy = [0.0000,0.0000];
//hue.lights[4].state.ct = 0;
//hue.lights[4].state.alert = "none";
//hue.lights[4].state.effect = "none";
//hue.lights[4].state.colormode = "hs";
//hue.lights[4].modelid ="LCT001";
//hue.lights[1].swversion = "65003148";
//hue.lights[1].pointsymbol = {};
//hue.lights[1].pointsymbol[1] = "none";
//hue.lights[1].pointsymbol[2] = "none";
//hue.lights[1].pointsymbol[3] = "none";
//hue.lights[1].pointsymbol[4] = "none";
//hue.lights[1].pointsymbol[5] = "none";
//hue.lights[1].pointsymbol[6] = "none";
//hue.lights[1].pointsymbol[7] = "none";
//hue.lights[1].pointsymbol[8] = "none";



//console.log(hue);

// upnp engine
client.on('listening', function () {
    client.addMembership('239.255.255.250');
    var address = client.address();
    console.log('UDP Client listening on ' + address.address + ":" + address.port);
    //client.setMulticastTTL(128);
});
client.on('message', function (msg, remote) {

    if (msg.toString().indexOf("urn:schemas-upnp-org:device:basic:1") > -1 ){
        console.log(new Date().toTimeString()+"Responding to  UPNP Discover request for HUE device from :"+remote.address);
        var response = "HTTP/1.1 200 OK\r\n\
HOST: 239.255.255.250:1900\r\n\
CACHE-CONTROL: max-age=100\r\n\
EXT:\r\n\
LOCATION: http://"+hue.config.ipaddress+":"+hue.config.ipport+"\r\n\
SERVER: FreeRTOS/6.0.5, UPnP/1.0, IpBridge/0.1\r\n\
ST: urn:schemas-upnp-org:device:basic:1\r\n\
USN: uuid:toddshuetest\r\n\
";
        var message = new Buffer(response);
        client.send(message,0,message.length,remote.port,remote.address,function(err,bytes) {
        });
    }
});

apihttp.createServer(function(req,res){
    console.log("Rest server:"+req.url+"("+req.method+")");



    if (req.method == 'POST') {
        //console.log("POST");
        var body = '';
        req.on('data', function (data) {
            body += data;
            //console.log("Partial body: " + body);
        });
        req.on('end', function () {
            // this is where the button press happens
            if (req.url='/api'){
                //this is what happens after you would push the button, it allows this post to succeed
                inbody = JSON.parse(body);
                res.writeHead(200, {'Content-Type': 'text/json'});
                var sendbody = [{"success":{"username": inbody.username}}];
                console.log('Reported that a user was added:'+inbody.username);
                res.write(JSON.stringify(sendbody));
                res.end();
            }
        });
    }

    if (req.method == "PUT"){

        console.log(req.method);
        // console.log(req);
        var fullBody = '';

        req.on('data', function(chunk) {
            // append the current chunk of data to the fullBody variable
            fullBody += chunk.toString();
        });
        req.on('end', function() {
            if ((req.url.indexOf("lights")) > 0){
                var bulb = req.url.substr(req.url.indexOf("lights")+7,2).replace("/","");

                // light changed


                res.writeHeader(200, {"Content-Type": "application/json"});
                var requestedState = JSON.parse(fullBody);
                var cnt = 0;
                var response =[];
                // make the response according to the lame spec
                // update the hue object
                for (var prop in requestedState) {
                    console.log (prop+':'+requestedState[prop]);
                    var element = {};
                    element["/lights/"+bulb+"/state/"+prop]=requestedState[prop]
                    response[cnt] = {"success":element};
                    //console.log(element,response);
                    hue.lights[bulb].state[prop]=requestedState[prop];
                    ++cnt;
                }
                //console.log(hue.lights[bulb].state);
                console.log(hue.lights[4].state.bri);
                res.write(JSON.stringify(response));
                res.end();
                console.log('Changing'+req.url+' - '+fullBody+' = '+requestedState.on);

               callback(bulb,hue.lights[bulb]);

                return;

            }

            var test = {};

            test.ok = "yes";
            res.writeHeader(200, {"Content-Type": "application/json"});
            res.write(JSON.stringify(test));

            res.end();
            console.log( fullBody);
        });
    }else if (req.method == "GET") {

        if ((req.url.indexOf("lights")) != -1){
            console.log ('requesting all lights');
            res.writeHeader(200, {"Content-Type": "application/json" });
            res.write(JSON.stringify(hue.lights));

            res.end();
            return;

        }


        if (req.url == "/description.xml"){

            //   res.writeHeader(200, {"Content-Type":"text/xml" });
            res.writeHeader(200, {"Content-Type":"application/xml" });
            var discoveryResponse = '<?xml version="1.0"?>\
    <root xmlns="urn:schemas-upnp-org:device-1-0">\
        <specVersion>\
            <major>1</major>\
            <minor>0</minor>\
        </specVersion>\
        <URLBase>http://'+hue.config.ipaddress+':'+hue.config.ipport+'/</URLBase>\
        <device>\
            <deviceType>urn:schemas-upnp-org:device:Basic:1</deviceType>\
            <friendlyName>Node Hue Bridge ('+hue.config.ipaddress+':'+hue.config.ipport+')</friendlyName>\
            <manufacturer></manufacturer>\
            <manufacturerURL></manufacturerURL>\
            <modelDescription>Philips hue Personal Wireless Lighting Bridge Router</modelDescription>\
            <modelName>Philips hue bridge 2012</modelName>\
            <modelNumber>929000226503</modelNumber>\
            <modelURL>http://www.meethue.com</modelURL>\
            <serialNumber>0017880ae670</serialNumber>\
            <UDN>uuid:toddshuetest</UDN>\
            <presentationURL>index.html</presentationURL>\
        </device>\
    </root>';
            res.write(discoveryResponse);
            res.end();

        }
    }


}).listen(80);
client.bind(1900);
};