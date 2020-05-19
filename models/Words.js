const mongoose = require('mongoose');

const WordsSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		validate: {
        validator: function(value) {
	            const self = this;
	            const errorMsg = value +' already in use!';
	            return new Promise((resolve, reject) => {
	                self.constructor.findOne({ name: value })
	                    .then(model => model._id ? reject({message:errorMsg}) : resolve(true)) 
	                    .catch(err => resolve(true)) 
	            });
	        },
        message: 'custom'
	    }
	},
	it: {
		type: String,
		unique: true,
	},
	es: {
		type: String,
		unique: true,
	}
})


module.exports = mongoose.model('Words', WordsSchema)