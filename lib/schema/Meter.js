var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Meter = new Schema({
    counter: Number,
    type   : { type: String, enum: ['summary', 'moment', 'invalid'] }
});

mongoose.model('Meter', Meter);