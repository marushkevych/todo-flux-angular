'use strict';

module.exports = translateErrorCode;

var ErrorCodes = {
    
    BAD_REQUEST: "Unfortunately, we're unable to process your request. We apologize for the inconvenience.",
    
    DUPLICATE_ITEM: "Can not add duplicate item! Plese try again.",
    
    SESSION_EXPIRED: "Your session has expired.",
};



function translateErrorCode () {
    return function(errorCode) {
        return ErrorCodes[errorCode] || errorCode;
    };
}
    
