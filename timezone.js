"use strict";

const tz_data = require("./moment-timezone/data/unpacked/2020d.json");
const moment_tz = require("./moment-timezone/builds/moment-timezone-with-data.js");
const moment = require("moment");

// If there is at most one timezone boundary, we expect it as a summer time.
const check_timezone_boundary = function(tz, start_utc, end_utc) {
    console.assert(tz.untils.length == tz.abbrs.length, tz.untils.length, tz.abbrs.length);
    console.assert(tz.untils.length == tz.offsets.length, tz.untils.length, tz.abbrs.length);

    const untils = tz.untils;
    const abbrs = tz.abbrs;
    const offsets = tz.offsets;
    const stz = search_timezone(start_utc, untils, abbrs, offsets);
    const etz = search_timezone(end_utc, untils, abbrs, offsets);
    console.assert(etz.index - stz.index == 2 || etz.index - stz.index == 0, etz.index, stz.index);
    if(stz.index == etz.index){
        // No DST change
        return [{abbr:abbrs[stz.index], offset:offsets[stz.index]}]
    }else if(etz.index == stz.index + 2){
        // DST change exists
        return [{abbr:abbrs[stz.index], offset:offsets[stz.index]},
            {abbr:abbrs[stz.index + 1], offset:offsets[stz.index + 1]}]
    }else{
        analyze_timezone(tz, start_utc, end_utc);
        return []
    }
}

const analyze_timezone = function(tz, s, e){
    for(let i = 0; i < tz.untils.length; i++){
        const u = tz.untils[i];
        const a = tz.abbrs[i];
        const date = moment(u).format("YYYY-MM-DD hh:mm:s");
        const start_date = moment(s).format("YYYY-MM-DD hh:mm:s");
        const end_date = moment(e).format("YYYY-MM-DD hh:mm:s");
        console.log(i, a, date, "   ", start_date, end_date);
    }
}
// search untils array from bottom.
const search_timezone = function(time, untils, abbrs, offsets){
    console.assert(null === untils[untils.length -1]);
    var index = null;
    for(let i = 0; i < untils.length; i++){
        if(null === untils[i]){
            index = i;
            break;
        }else{
            console.assert(time !== untils[i]);//Because I'm not sure the spec in this case.
            if(time < untils[i]){
                index = i;
                break;
            }
        }
    }
    console.assert(index !== null, time, untils);

    return {index:index, until:untils[index], abbr:abbrs[index], offset:offsets[index] };
}

var start_date = Date.parse('2021-01-01');
var end_date = Date.parse('2022-01-01');

const offset_string = function(offset){
    var negative_offset = false;
    if(offset < 0){
        negative_offset = true;
        offset = (-1) * offset;
    }
    // use moment to format offset string
    const offset_ms = 60 * 1000 * offset; // since offset min

    if(negative_offset){
        return moment(offset_ms).tz('UTC').format("+hh:mm"); // drop YYYY/MM/DD
    }else{
        return moment(offset_ms).tz('UTC').format("-hh:mm"); // drop YYYY/MM/DD
    }
}

for(const i in tz_data.zones){
    const tz = tz_data.zones[i];
    const r = check_timezone_boundary(tz, start_date, end_date);
    switch (r.length){
        case 1:
            console.log("".concat(tz.name, ",UTC", offset_string(r[0].offset), ",f,,"));
            break;
        case 2:
            // Because we have Southern Hemisphere, we have to distinguish summer time and winter time.
            var summer;
            var winter;
            var swapped;
            if(r[0].offset < r[1].offset){
                summer = r[1];
                winter = r[0];
                swapped = false;
            }else{
                summer = r[0];
                winter = r[1];
                swapped = true;
            }
            console.log("".concat(tz.name, ",UTC:", offset_string(summer.offset), ",t,", summer.abbr,",", winter.abbr));
            break;
        default:
            break;
    }
}




