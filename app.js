hb = require('./huebridge');
hb.start(test);
function test(num,light){
    console.log('bulb:'+num);
    console.log(light);

}