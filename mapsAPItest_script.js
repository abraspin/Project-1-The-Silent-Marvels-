// This is the API key I set up through Google
var apiKey = "AIzaSyBXaAKr4axxaUBPZXJD-cKQF9qtHVrzXe0";
// Search parameters start after the q= and use either + or %20 to escape spaces
/* TODO:
    - assuming bars will stay as the main search parameter
        - do we want anything else listed?
    - near+ZIPCODE is one option but could also be an actual physical address
        - ex. near+123+Example+Street,Austin,TX+78701
*/
var queryURL = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=bars+near+78626`; 
var embedMap = $("#embed-map");
embedMap.attr("src", queryURL);

/* Toggle modal on by adding class is-active
TODO:
    - would just have to add this wherever in the code makes sense for it to pop up
        - either at the beginning
        - or once their search is complete
*/
$(".modal").addClass("is-active");

// Event listener on the modal to close the modal (the button is not doing anything currently)
$(".modal").on("click", function() {
    event.preventDefault;
    $(".modal").removeClass("is-active");
});