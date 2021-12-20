import mongoose from 'mongoose'


//define a schema for a document (that is in a collection)
const instance = mongoose.Schema({
    caption: String,
    user: String,
    image: String,
    comments: [],
})

export default mongoose.model('posts', instance)     //post is the collection name,