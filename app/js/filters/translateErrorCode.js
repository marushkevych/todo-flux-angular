'use strict';

module.exports = translateErrorCode;

var ErrorCodes = {
    
    BAD_REQUEST: {
        en: "Unfortunately, we're unable to process your request. We apologize for the inconvenience.",
        fr: "Malheureusement, il nous est impossible de donner suite à votre demande. Nous sommes désolés des inconvénients subis, le cas échéant."
    },
    
    DUPLICATE_ITEM: {
        en: "Can not add duplicate item! Plese try again.",
        fr: "Vous ne pouvez pas ajouter l'article en double ! Plese réessayer ."
    },
    
    SESSION_EXPIRED: {
        en: "Your session has expired.",
        fr: "Votre session a expiré."        
    }
};


translateErrorCode.$inject = ['gettextCatalog'];

function translateErrorCode (gettextCatalog) {
    return function(errorCode) {
        var lang = gettextCatalog.currentLanguage === "fr_CA" ? 'fr' : 'en';
        if(ErrorCodes[errorCode] && ErrorCodes[errorCode][lang]){
            return ErrorCodes[errorCode][lang];
        }else{
            return errorCode;
        }
    };
    
}
