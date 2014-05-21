//! calcs.js
//! Calculate synthetic data from sensor data
//! custom values.
//! version : .1
//! homegrownmarine.com

// CURRENTLY DISABLED :: untested, provided as example

var deg = exports.deg = function deg(radians) {
    return (radians*180/Math.PI + 360) % 360;
}    

var rad = exports.rad = function rad(degrees) {
    return degrees * Math.PI / 180;
}

//the current is the difference of the speed and heading over ground
//and the speed and heading over water
var calcCurrents = function(speed, hdg, sog, cog) {
    //GM: TODO: understand 90 deg offset.
    //convert cog and hdg to radians, with north right
    hdg = rad(90.0 - hdg);
    cog = rad(90.0 - cog);

    //break out x and y components of current vector
    var current_x = sog * Math.cos(cog) - speed * Math.cos(hdg);
    var current_y = sog * Math.sin(cog) - speed * Math.sin(hdg);

    //drift is the magnitude of the current vector
    var drift = Math.sqrt(current_x * current_x + current_y * current_y);
    
    //set is the angle of the current vector (note we special case pure North or South)
    var set = 0;
    if ( current_x === 0 ) {
        set = curr_y < 0? 180: 0;
    }
    else {
        //normalize 0 - 360
        set = (90.0 - deg(Math.atan2(current_y, current_x)) + 360) % 360;
    }

    return { set: set, drift: drift };
};

exports.load = function(server, boatData, settings) {
    //@ 1Hz, broadcast current set and drift
    setInterval(function() {
        //first, get the latest boat data
        var data = boatData.now();
        
        if ( isNaN(data.speed*data.hdg*data.sog*data.cog) ) return;

        //then use it to calculate the current vector
        var currents = calcCurrents( data.speed, data.hdg, data.sog, data.cog );

        //broadcast the new bit of data. boatData will handle
        //NMEA formatting.
        boatData.broadcast({
            type: 'vdr',
            set: currents.set,
            drift: currents.drift
        });
    }, 1000);
};