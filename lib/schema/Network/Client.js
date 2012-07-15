var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var NetworkClientSchema = new Schema({
    ip  : String,
    mac : { type: String, unique: true },
    name: String,
    up  : { type: Boolean, default: false }
});

mongoose.model('NetworkClient', NetworkClientSchema);