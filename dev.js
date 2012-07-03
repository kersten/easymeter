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

Counter.find({type: 'moment'}).sort('_id', -1).limit(30).exec(function (err, docs) {
    if (err) return;

    docs.forEach(function (doc) {
        console.log(doc.get('_id').getTimestamp());
    });

    process.exit();
});