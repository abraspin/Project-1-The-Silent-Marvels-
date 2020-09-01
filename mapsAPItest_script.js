// This is the API key I set up through Google
var apiKey = "AIzaSyBXaAKr4axxaUBPZXJD-cKQF9qtHVrzXe0";
// Search parameters start after the q= and use either + or %20 to escape spaces
/* TODO:
    - assuming bars will stay as the main search parameter
        - do we want anything else listed?
    - near+ZIPCODE is one option but could also be an actual physical address
        - ex. near+123+Example+Street,Austin,TX+78701
*/
var queryURL = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=bars+near+ZIPCODE`; 
var embedMap = $("#embed-map");
embedMap.attr("src", queryURL);