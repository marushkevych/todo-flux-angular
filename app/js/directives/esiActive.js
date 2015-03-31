'use strict';

module.exports = esiActive;
        
    
/** 'esi-acive' attribute can be added to links in order to style them with 'selected' class when
 * current location path matches the value of the link's href.
 * 
 * For example:
 * <a href="/member/activity" esi-active >activity</a>
 * will get class='active' if current location starts with '/member/activity'
 *
 * Note: '/en' or '/fr' language context or '#' or '#!' hashbang mode will be ignoroed, so
 * <a href="/fr/member/activity" esi-active >activity</a>
 * will get class='active' if current location starts with '/member/activity'
 *
 * It is possible to override href value by providing a value to 'esi-acive' attribute
 * 
 * For example:
 * <a href="/member/activity" esi-active='/member' >member</a>
 * will be 'active' if current location starts with '/member'
 *
 */
esiActive.$inject = ['$location'];
function esiActive($location) {
    return function(scope, elm, attrs) {
        
        // if esi-active attribute value is not provided - use href but without the '/en' or '/fr' or '#' or '#!' prefix
        var href = attrs.esiActive || attrs.href.replace(/^(?:\/en\/)|(?:\/fr\/)|(?:#!?\/)/, '/');
        
        scope.$watch(
            function(){
                return $location.path();
            },
            
            function(path) {
                if (path.match(href)) {
                  elm.addClass("selected");
                } else {
                  elm.removeClass("selected");
                }
            }
        );
    };
}