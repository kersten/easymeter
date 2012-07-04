var mongoose = require('mongoose'),
    xDate = require('xdate');

mongoose.connect('mongodb://easymeter:XSbOXfNH@ds033457.mongolab.com:33457/easymeter', function(err) {
    if (err) throw err;
});

var counter = new mongoose.Schema({
    counter : Number,
    type    : { type: String, enum: ['summary', 'moment', 'invalid'] }
});

var Counter = mongoose.model('Counter', counter);

function map () {
    var date = new xDate(this.id.getTimestamp()),
        hour = date.toString('dd.MM.yyyy HH'),
        stats = {};

    stats[hour] = this.counter;
    emit(this.type, stats);
}

function reduce(key, values) {
    var out = {};
    function merge(a, b) {
        for (var k in b) {
            if (!b.hasOwnProperty(k)) {
                continue;
            }
            a[k] = (a[k] || 0) + b[k];
        }
    }
    for (var i=0; i < values.length; i++) {
        merge(out, values[i]);
    }
    return out;
}

// $lt: Math.floor((new xDate()).setHours(0).setMinutes(0).setSeconds(0).addDays(1).getTime()/1000).toString(16) + "0000000000000000"

Counter.findOne({
    type: 'summary',
    _id: {
        $gt: Math.floor((new xDate()).setHours(0).setMinutes(0).setSeconds(0).setDate(1).getTime()/1000).toString(16) + "0000000000000000"
    }
}).limit(1).exec(function (err, docs) {
        if (err) return;

        Counter.findOne({
            type: 'summary',
            _id: {
                $lt: Math.floor((new xDate()).setHours(0).setMinutes(0).setSeconds(0).setDate((new xDate()).getFullYear(), (new xDate()).getMonth()).getTime()/1000).toString(16) + "0000000000000000"
            }
        }).sort('_id', -1).limit(1).exec(function (err, last) {
                if (err) return;

                console.log(Math.floor((last.get('counter') - docs.get('counter')) * 100) / 100);
            });
    });