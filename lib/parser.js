const xml2js = require('xml2js');
const processors = xml2js.processors;

module.exports = {
    /**
     * Parse XML string to JS object
     * @param {String} file
     * @param {Function} callback
     */
    parse:(file,callback) =>{
        const parser = new xml2js.Parser({
            explicitArray:false,
            async:true,
            valueProcessors:[
                processors.parseNumbers,
                processors.parseBooleans
            ]
        });

        parser.parseString(file,(err,result) =>{
            if(err){
                callback(err);
            } else {
                callback(err,result);
            }
        });
    }
};
