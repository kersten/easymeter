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
    console.log('TEST');
    var date = new xDate(this.id.getTimestamp()),
        hour = date.toString('dd.MM.yyyy HH'),
        stats = {};

    stats[hour] = this.counter;
    emit(this.type, stats);
}

function reduce(hours, values) {
    var n = {totalDuration : 0, num : 0};
    for ( var i=0; i<values.length; i++ ){
        n.totalDuration += values[i].totalDuration;
        n.num += values[i].num;
    }
    return n;
}

mongoose.connection.db.executeDbCommand({
    mapreduce: "counters", //the name of the collection we are map-reducing *note, this is the model Ping we defined above...mongoose automatically appends an 's' to the model name within mongoDB
    query: { 'type' : 'moment' }, //I've included this as an example of how to query for parameters outside of the map-reduced variable
    map: map, //a function we'll define next for mapping
    reduce: reduce, //a function we'll define next for reducing
    sort: {url: 1}, //let's sort descending...it makes the operation run faster
    out: "avr" //the collection that will contain the map-reduce results *note, this must be a different collection than the map-reduce input
}, function(err, dbres) {
    console.log(arguments);
});


Counter.find({type: 'moment'}).sort('_id', -1).limit(30).exec(function (err, docs) {
    if (err) return;

    docs.forEach(function (doc) {
        console.log(doc.get('_id').getTimestamp());
    });

    //process.exit();
});